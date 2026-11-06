import { All, Controller, Inject, Req, Res } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply, FastifyRequest } from "fastify";

import { Public } from "@/platform/auth/decorators/public.decorator";
import type { MarketplaceAuth } from "./marketplace-auth.factory";
import { MARKETPLACE_AUTH } from "./marketplace-auth.token";

/**
 * Bridges Fastify to Better Auth's fetch-style handler. Mounted at /api/marketplace-auth/*
 * (sign-up, sign-in, magic link, OAuth callbacks, session, sign-out ...).
 */
@Public()
@Controller("marketplace-auth")
export class MarketplaceAuthController {
  constructor(
    @Inject(MARKETPLACE_AUTH) private readonly auth: MarketplaceAuth,
  ) {}

  @All("*")
  async handle(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const hasBody = request.method !== "GET" && request.method !== "HEAD";

    const response = await this.auth.handler(
      new Request(url, {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        body:
          hasBody && request.body !== undefined
            ? JSON.stringify(request.body)
            : undefined,
      }),
    );

    reply.status(response.status);
    response.headers.forEach((value, key) => {
      const name = key.toLowerCase();
      // set-cookie is forwarded below (it can repeat); length changes after re-serializing.
      if (name !== "set-cookie" && name !== "content-length") {
        reply.header(key, value);
      }
    });

    const cookies = response.headers.getSetCookie();
    if (cookies.length > 0) {
      reply.header("set-cookie", cookies);
    }

    const body = await response.text();
    return reply.send(body.length > 0 ? body : null);
  }
}
