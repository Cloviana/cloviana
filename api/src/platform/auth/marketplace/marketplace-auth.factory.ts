import { type Auth, type BetterAuthOptions, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins/magic-link";
import { oneTimeToken } from "better-auth/plugins/one-time-token";

import { requestHost } from "@/platform/tenancy/request-host";
import type { Tenant } from "@/platform/tenancy/tenant";

export const MARKETPLACE_AUTH_BASE_PATH = "/api/marketplace-auth";

export interface MarketplaceAuthSettings {
  /** Origin of the shared auth domain, e.g. https://auth.cloviana.com */
  authUrl: string;
  secret: string;
  secure: boolean;
  google?: { clientId: string; clientSecret: string };
}

export interface MarketplaceAuthDeps {
  // biome-ignore lint/suspicious/noExplicitAny: Prisma client type is generated per schema.
  prisma: any;
  settings: MarketplaceAuthSettings;
  resolveTenant(host: string | undefined): Promise<Tenant | null>;
  sendEmail(input: { to: string; subject: string; text: string }): void;
}

type RequestLike = { headers: Headers } | undefined | null;

type MarketplaceAuthOptions = BetterAuthOptions & {
  plugins: [ReturnType<typeof magicLink>, ReturnType<typeof oneTimeToken>];
};

export type MarketplaceAuth = Auth<MarketplaceAuthOptions>;

function hostOf(request: RequestLike): string | undefined {
  return request ? requestHost(request.headers) : undefined;
}

/**
 * Better Auth for the marketplace realm: vendors and shoppers. Platform owners and staff
 * authenticate with a separate Better Auth instance (see createPlatformAuth).
 *
 * One instance serves every marketplace. Cookies are host-only, so a session on
 * shop-a.example is never sent to shop-b.example. Links in emails point at the marketplace's
 * own host, and only Google sign-in goes through the shared auth domain.
 */
export function createMarketplaceAuth(
  deps: MarketplaceAuthDeps,
): MarketplaceAuth {
  const { settings } = deps;
  const authOrigin = new URL(settings.authUrl).origin;
  const protocol = authOrigin.startsWith("https") ? "https" : "http";

  /** Re-points a link Better Auth built on the auth domain at the marketplace's own host. */
  async function toTenantLink(url: string, request: RequestLike) {
    const host = hostOf(request);
    const tenant = await deps.resolveTenant(host);
    const link = new URL(url);
    if (host && tenant) {
      link.protocol = `${protocol}:`;
      link.host = host;
    }
    return { link: link.toString(), name: tenant?.name ?? "Cloviana" };
  }

  function email(
    to: string,
    url: string,
    request: RequestLike,
    build: (name: string, link: string) => { subject: string; text: string },
  ) {
    // Not awaited: response time must not reveal whether the account exists.
    void toTenantLink(url, request)
      .then(({ link, name }) => deps.sendEmail({ to, ...build(name, link) }))
      .catch(() => undefined);
  }

  return betterAuth<MarketplaceAuthOptions>({
    appName: "Cloviana",
    baseURL: authOrigin,
    basePath: MARKETPLACE_AUTH_BASE_PATH,
    secret: settings.secret,
    database: prismaAdapter(deps.prisma, { provider: "postgresql" }),

    // The Prisma models are MarketplaceUser, MarketplaceSession, MarketplaceAccount and
    // MarketplaceVerification.
    user: { modelName: "marketplaceUser" },
    session: { modelName: "marketplaceSession" },
    account: {
      modelName: "marketplaceAccount",
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },
    verification: { modelName: "marketplaceVerification" },

    advanced: {
      database: { generateId: "uuid" },
      cookiePrefix: "cloviana-mkt",
      useSecureCookies: settings.secure,
    },

    // Allow the shared auth domain and whichever marketplace host the request came from.
    trustedOrigins: async (request) => {
      const origins = [authOrigin];
      const host = hostOf(request);
      if (host && (await deps.resolveTenant(host))) {
        origins.push(`${protocol}://${host}`);
      }
      return origins;
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) =>
        email(user.email, url, request, (name, link) => ({
          subject: `Reset your ${name} password`,
          text: `Reset your password: ${link}\n\nIf you did not ask for this, ignore this email.`,
        })),
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }, request) =>
        email(user.email, url, request, (name, link) => ({
          subject: `Verify your email for ${name}`,
          text: `Confirm your email address: ${link}`,
        })),
    },

    socialProviders: settings.google
      ? {
          google: {
            clientId: settings.google.clientId,
            clientSecret: settings.google.clientSecret,
            prompt: "select_account",
          },
        }
      : {},

    plugins: [
      magicLink({
        expiresIn: 300,
        sendMagicLink: async ({ email: to, url }, ctx) =>
          email(to, url, ctx?.request, (name, link) => ({
            subject: `Sign in to ${name}`,
            text: `Sign in: ${link}\n\nThis link works once and expires in 5 minutes.`,
          })),
      }),
      // Hands a session from the shared auth domain to a marketplace host after Google sign-in.
      oneTimeToken({ expiresIn: 3, storeToken: "hashed" }),
    ],
  });
}
