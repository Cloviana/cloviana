import { Module } from "@nestjs/common";

import { ResendModule } from "@/integrations/resend/resend.module";
import { MarketplaceAuthMailer } from "@/platform/auth/marketplace/marketplace-auth.mailer";
import { AppConfiguration } from "@/platform/config/app.configuration";
import { PrismaService } from "@/platform/database/prisma/prisma.service";
import { PlatformAuthController } from "./platform-auth.controller";
import { type PlatformAuth, createPlatformAuth } from "./platform-auth.factory";
import { PLATFORM_AUTH } from "./platform-auth.token";

@Module({
  imports: [ResendModule],
  controllers: [PlatformAuthController],
  providers: [
    MarketplaceAuthMailer,
    {
      provide: PLATFORM_AUTH,
      inject: [PrismaService, AppConfiguration, MarketplaceAuthMailer],
      useFactory: (
        prisma: PrismaService,
        config: AppConfiguration,
        mailer: MarketplaceAuthMailer,
      ): PlatformAuth =>
        createPlatformAuth({
          prisma,
          sendEmail: (input) => mailer.send(input),
          settings: {
            appUrl: config.appUrl,
            secret: config.platformAuthSecret,
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
  exports: [PLATFORM_AUTH],
})
export class PlatformAuthModule {}
