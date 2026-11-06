import { randomBytes, timingSafeEqual } from "node:crypto";
import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Req,
  Res,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply, FastifyRequest } from "fastify";

import { Public } from "@/platform/auth/decorators/public.decorator";
import { AppConfiguration } from "@/platform/config/app.configuration";
import { requestHost } from "@/platform/tenancy/request-host";
import { TenantResolverService } from "@/platform/tenancy/tenant-resolver.service";
import type { MarketplaceAuth } from "./marketplace-auth.factory";
import { MARKETPLACE_AUTH } from "./marketplace-auth.token";

const PREFIX = "/api/marketplace-auth-handoff";
const NONCE_COOKIE = "cloviana-handoff";
const HOST_PATTERN = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{1,5})?$/i;
const NONCE_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

type Query = Record<string, string | undefined>;

/**
 * Social sign-in (Google) for marketplaces on any domain.
 *
 * Google only accepts pre-registered redirect URIs, which cannot cover every marketplace
 * domain. So OAuth runs on one shared auth domain and the finished session is handed back:
 *
 *   marketplace host      auth domain                         Google
 *   start  (sets nonce) ->
 *                         begin  ------------------------->   consent
 *                         callback <------------------------
 *                         finish (one-time token)
 *   complete (checks nonce, sets the host's own session cookie)
 *
 * The nonce cookie ties the handoff to the browser that started it, so a link crafted by an
 * attacker cannot sign a victim into the attacker's account.
 */
@Public()
@Controller("marketplace-auth-handoff")
export class MarketplaceAuthHandoffController {
  private readonly authOrigin: string;
  private readonly protocol: string;
  private readonly secure: boolean;

  constructor(
    @Inject(MARKETPLACE_AUTH) private readonly auth: MarketplaceAuth,
    private readonly resolver: TenantResolverService,
    config: AppConfiguration,
  ) {
    this.authOrigin = new URL(config.marketplaceAuthUrl).origin;
    this.protocol = this.authOrigin.startsWith("https") ? "https" : "http";
    this.secure = config.environment === "production";
  }

  /** On the marketplace host. */
  @Get("start")
  async start(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const query = request.query as Query;
    this.assertProvider(query.provider);

    const host = requestHost(request.headers);
    if (!host || !(await this.resolver.resolveHost(host))) {
      throw new NotFoundException("Marketplace not found");
    }

    const nonce = randomBytes(24).toString("base64url");
    reply.header(
      "set-cookie",
      `${NONCE_COOKIE}=${nonce}; Path=${PREFIX}; HttpOnly; SameSite=Lax; Max-Age=600${this.secure ? "; Secure" : ""}`,
    );

    return this.redirect(
      reply,
      `${this.authOrigin}${PREFIX}/begin?${new URLSearchParams({
        provider: "google",
        host,
        next: safeNext(query.next),
        nonce,
      })}`,
    );
  }

  /** On the auth domain: starts the Google flow. */
  @Get("begin")
  async begin(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const query = request.query as Query;
    this.assertProvider(query.provider);
    const { host, next, nonce } = await this.readHandoff(query);

    const finish = `${this.authOrigin}${PREFIX}/finish?${new URLSearchParams({ host, next, nonce })}`;
    const response = await this.auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL: finish,
        errorCallbackURL: `${this.origin(host)}/login?error=social_failed`,
        disableRedirect: true,
      },
      headers: fromNodeHeaders(request.headers),
      asResponse: true,
    });

    const { url } = (await response.json()) as { url?: string };
    if (!url) {
      throw new BadRequestException("Social sign-in is not available");
    }

    this.forwardCookies(response, reply);
    return this.redirect(reply, url);
  }

  /** On the auth domain: after Google, mints a one-time token for the marketplace host. */
  @Get("finish")
  async finish(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const { host, next, nonce } = await this.readHandoff(
      request.query as Query,
    );
    const headers = fromNodeHeaders(request.headers);

    const session = await this.auth.api.getSession({ headers });
    if (!session) {
      return this.redirect(
        reply,
        `${this.origin(host)}/login?error=social_failed`,
      );
    }

    const { token } = await this.auth.api.generateOneTimeToken({ headers });

    // The session itself stays alive: the marketplace host receives the same session.
    // Only the auth domain's copy of the cookie is dropped.
    await this.clearSessionCookies(reply);

    return this.redirect(
      reply,
      `${this.origin(host)}${PREFIX}/complete?${new URLSearchParams({ token, next, nonce })}`,
    );
  }

  /** On the marketplace host: trades the token for this host's own session cookie. */
  @Get("complete")
  async complete(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const query = request.query as Query;
    const host = requestHost(request.headers);
    if (!host || !(await this.resolver.resolveHost(host))) {
      throw new NotFoundException("Marketplace not found");
    }

    const next = safeNext(query.next);
    const failed = "/login?error=handoff_failed";

    const expected = readCookie(request.headers.cookie, NONCE_COOKIE);
    const nonceMatches =
      Boolean(expected) &&
      Boolean(query.nonce) &&
      expected?.length === query.nonce?.length &&
      timingSafeEqual(
        Buffer.from(expected as string),
        Buffer.from(query.nonce as string),
      );

    reply.header(
      "set-cookie",
      `${NONCE_COOKIE}=; Path=${PREFIX}; HttpOnly; SameSite=Lax; Max-Age=0${this.secure ? "; Secure" : ""}`,
    );

    if (!nonceMatches || !query.token) {
      return this.redirect(reply, failed);
    }

    const response = await this.auth.api.verifyOneTimeToken({
      body: { token: query.token },
      headers: fromNodeHeaders(request.headers),
      asResponse: true,
    });
    if (!response.ok) {
      return this.redirect(reply, failed);
    }

    this.forwardCookies(response, reply);
    return this.redirect(reply, next);
  }

  private assertProvider(provider: string | undefined) {
    if (provider !== "google") {
      throw new BadRequestException("Unsupported provider");
    }
  }

  private async readHandoff(query: Query) {
    const host = query.host?.toLowerCase();
    if (
      !host ||
      !HOST_PATTERN.test(host) ||
      !(await this.resolver.resolveHost(host)) ||
      !query.nonce ||
      !NONCE_PATTERN.test(query.nonce)
    ) {
      throw new BadRequestException("Invalid sign-in request");
    }
    return { host, next: safeNext(query.next), nonce: query.nonce };
  }

  private origin(host: string) {
    return `${this.protocol}://${host}`;
  }

  private redirect(reply: FastifyReply, location: string) {
    return reply.status(302).header("location", location).send();
  }

  // Fastify appends repeated set-cookie headers, so cookies already set on the reply are kept.
  private forwardCookies(response: Response, reply: FastifyReply) {
    const cookies = response.headers.getSetCookie();
    if (cookies.length > 0) {
      reply.header("set-cookie", cookies);
    }
  }

  private async clearSessionCookies(reply: FastifyReply) {
    const { authCookies } = await this.auth.$context;
    const names = [
      authCookies.sessionToken.name,
      authCookies.sessionData.name,
      authCookies.dontRememberToken.name,
    ];
    const secure = this.secure ? "; Secure" : "";
    reply.header(
      "set-cookie",
      names.map(
        (name) =>
          `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
      ),
    );
  }
}

/** Only same-site relative paths: blocks open redirects such as //evil.example. */
function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  // biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting control characters is the point.
  if (/[\\\u0000-\u001f]/.test(next)) {
    return "/";
  }
  return next;
}

function readCookie(
  header: string | undefined,
  name: string,
): string | undefined {
  for (const part of header?.split(";") ?? []) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      return value.join("=");
    }
  }
  return undefined;
}
