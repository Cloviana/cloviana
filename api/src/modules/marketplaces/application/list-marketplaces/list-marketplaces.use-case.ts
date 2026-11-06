import { Inject, Injectable } from "@nestjs/common";

import {
  MARKETPLACE_REPOSITORY,
  type MarketplaceRepository,
} from "@/modules/marketplaces/application/ports/marketplace.repository.port";
import type { Marketplace } from "@/modules/marketplaces/domain/marketplace";

export interface ListMarketplacesInput {
  ownerId: string;
}

@Injectable()
export class ListMarketplacesUseCase {
  constructor(
    @Inject(MARKETPLACE_REPOSITORY)
    private readonly marketplaces: MarketplaceRepository,
  ) {}

  execute(input: ListMarketplacesInput): Promise<Marketplace[]> {
    return this.marketplaces.findByOwner(input.ownerId);
  }
}
