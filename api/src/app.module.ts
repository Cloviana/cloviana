import { AgentsModule } from "@/modules/agents/agents.module";
import { ConfigifyModule } from "@itgorillaz/configify";
import { Module } from "@nestjs/common";

import { ExaModule } from "@/integrations/exa/exa.module";
import { OpenRouterModule } from "@/integrations/openrouter/openrouter.module";
import { ResendModule } from "@/integrations/resend/resend.module";
import { CatalogModule } from "@/modules/catalog/catalog.module";
import { CustomersModule } from "@/modules/customers/customers.module";
import { FilesModule } from "@/modules/files/files.module";
import { MarketplacesModule } from "@/modules/marketplaces/marketplaces.module";
import { OnboardingModule } from "@/modules/onboarding/onboarding.module";
import { PlatformUsersModule } from "@/modules/platform-users/platform-users.module";
import { ThemesModule } from "@/modules/themes/themes.module";
import { VendorsModule } from "@/modules/vendors/vendors.module";
import { AuthModule } from "@/platform/auth/auth.module";
import { MarketplaceAuthModule } from "@/platform/auth/marketplace/marketplace-auth.module";
import { AppCacheModule } from "@/platform/cache/cache.module";
import { RedisModule } from "@/platform/cache/redis/redis.module";
import { PrismaModule } from "@/platform/database/prisma/prisma.module";
import { HealthModule } from "@/platform/health/health.module";
import { InngestModule } from "@/platform/jobs/inngest/inngest.module";
import { TenancyModule } from "@/platform/tenancy/tenancy.module";

@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    PrismaModule,
    AuthModule,
    TenancyModule,
    MarketplaceAuthModule,
    RedisModule,
    AppCacheModule,
    HealthModule,
    InngestModule,
    MarketplacesModule,
    CatalogModule,
    ThemesModule,
    AgentsModule,
    FilesModule,
    PlatformUsersModule,
    OnboardingModule,
    CustomersModule,
    VendorsModule,
    ExaModule,
    OpenRouterModule,
    ResendModule,
  ],
})
export class AppModule {}
