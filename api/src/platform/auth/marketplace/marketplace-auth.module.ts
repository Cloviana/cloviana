import { Module } from "@nestjs/common";

import { ResendModule } from "@/integrations/resend/resend.module";
import { AppConfiguration } from "@/platform/config/app.configuration";
import { PrismaService } from "@/platform/database/prisma/prisma.service";
import { TenantResolverService } from "@/platform/tenancy/tenant-resolver.service";
import { MarketplaceAuthHandoffController } from "./marketplace-auth-handoff.controller";
import { MarketplaceAuthController } from "./marketplace-auth.controller";
import {
  type MarketplaceAuth,
  createMarketplaceAuth,
} from "./marketplace-auth.factory";
import { MarketplaceAuthMailer } from "./marketplace-auth.mailer";
import { MARKETPLACE_AUTH } from "./marketplace-auth.token";
import { MarketplaceSessionService } from "./marketplace-session.service";

@Module({
  imports: [ResendModule],
  controllers: [MarketplaceAuthController, MarketplaceAuthHandoffController],
  providers: [
    MarketplaceAuthMailer,
    MarketplaceSessionService,
    {
      provide: MARKETPLACE_AUTH,
      inject: [
        PrismaService,
        AppConfiguration,
        TenantResolverService,
        MarketplaceAuthMailer,
      ],
      useFactory: (
        prisma: PrismaService,
        config: AppConfiguration,
        resolver: TenantResolverService,
        mailer: MarketplaceAuthMailer,
      ): MarketplaceAuth =>
        createMarketplaceAuth({
          prisma,
          resolveTenant: (host) => resolver.resolveHost(host),
          sendEmail: (input) => mailer.send(input),
          settings: {
            authUrl: config.marketplaceAuthUrl,
            secret: config.marketplaceAuthSecret,
            secure: config.environment === "production",
            google:
              config.googleClientId && config.googleClientSecret
                ? {
                    clientId: config.googleClientId,
                    clientSecret: config.googleClientSecret,
                  }
                : undefined,
          },
        }),
    },
  ],
  exports: [MARKETPLACE_AUTH, MarketplaceSessionService],
})
export class MarketplaceAuthModule {}
