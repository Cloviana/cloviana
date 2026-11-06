import { Module } from "@nestjs/common";

import { MarketplaceAuthModule } from "@/platform/auth/marketplace/marketplace-auth.module";
import { TenantResolverService } from "@/platform/tenancy/tenant-resolver.service";
import { EnsureCustomerUseCase } from "./application/ensure-customer/ensure-customer.use-case";
import { GetStorefrontSiteUseCase } from "./application/get-storefront-site/get-storefront-site.use-case";
import { CUSTOMER_REPOSITORY } from "./application/ports/customer.repository.port";
import { StorefrontResolver } from "./application/ports/storefront-resolver.port";
import { PrismaCustomerRepository } from "./infrastructure/prisma/prisma-customer.repository";
import { StorefrontAuthGuard } from "./presentation/http/storefront-auth.guard";
import { StorefrontController } from "./presentation/http/storefront.controller";

@Module({
  imports: [MarketplaceAuthModule],
  controllers: [StorefrontController],
  providers: [
    EnsureCustomerUseCase,
    GetStorefrontSiteUseCase,
    StorefrontAuthGuard,
    { provide: StorefrontResolver, useExisting: TenantResolverService },
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
  ],
  exports: [EnsureCustomerUseCase],
})
export class CustomersModule {}
