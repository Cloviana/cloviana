import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const PLATFORM_AUTH_BASE_PATH = "/api/platform-auth";

export interface PlatformAuthDeps {
  // biome-ignore lint/suspicious/noExplicitAny: Prisma client type is generated per schema.
  prisma: any;
  settings: {
    /** Origin of the admin app. The browser reaches this API through its same-origin rewrite. */
    appUrl: string;
    secret: string;
    secure: boolean;
    google?: { clientId: string; clientSecret: string };
  };
  sendEmail(input: { to: string; subject: string; text: string }): void;
}

/**
 * Better Auth for the platform realm: marketplace owners and staff. The PlatformUser row is the
 * user, so Marketplace.ownerId keeps pointing at the same id. Marketplace vendors and shoppers
 * use a separate instance (see createMarketplaceAuth).
 */
export function createPlatformAuth(deps: PlatformAuthDeps) {
  const { settings } = deps;
  const origin = new URL(settings.appUrl).origin;

  return betterAuth({
    appName: "Cloviana",
    baseURL: origin,
    basePath: PLATFORM_AUTH_BASE_PATH,
    secret: settings.secret,
    database: prismaAdapter(deps.prisma, { provider: "postgresql" }),

    user: { modelName: "platformUser" },
    session: { modelName: "platformSession" },
    account: {
      modelName: "platformAccount",
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },
    verification: { modelName: "platformVerification" },

    advanced: {
      database: { generateId: "uuid" },
      cookiePrefix: "cloviana-platform",
      useSecureCookies: settings.secure,
    },

    trustedOrigins: [origin],

    emailAndPassword: {
      enabled: true,
      // ponytail: matches Supabase's confirmations-off behavior, so sign-up logs in immediately.
      // Turn on requireEmailVerification + emailVerification.sendVerificationEmail when needed.
      minPasswordLength: 12,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        deps.sendEmail({
          to: user.email,
          subject: "Reset your Cloviana password",
          text: `Reset your password: ${url}\n\nIf you did not ask for this, ignore this email.`,
        });
      },
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
  });
}

export type PlatformAuth = ReturnType<typeof createPlatformAuth>;
