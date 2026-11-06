import { Module } from "@nestjs/common";

import { CreateMarketplaceUseCase } from "./application/create-marketplace/create-marketplace.use-case";
import { GetMarketplaceUseCase } from "./application/get-marketplace/get-marketplace.use-case";
import { ListMarketplacesUseCase } from "./application/list-marketplaces/list-marketplaces.use-case";
import { MARKETPLACE_REPOSITORY } from "./application/ports/marketplace.repository.port";
import { PrismaMarketplaceRepository } from "./infrastructure/prisma/prisma-marketplace.repository";
import { MarketplacesController } from "./presentation/http/marketplaces.controller";

@Module({
  controllers: [MarketplacesController],
  providers: [
    CreateMarketplaceUseCase,
    ListMarketplacesUseCase,
    GetMarketplaceUseCase,
    {
      provide: MARKETPLACE_REPOSITORY,
      useClass: PrismaMarketplaceRepository,
    },
  ],
  // Public contract for other modules (e.g. onboarding); the repository stays private.
  exports: [
    CreateMarketplaceUseCase,
    ListMarketplacesUseCase,
    GetMarketplaceUseCase,
  ],
})
export class MarketplacesModule {}
