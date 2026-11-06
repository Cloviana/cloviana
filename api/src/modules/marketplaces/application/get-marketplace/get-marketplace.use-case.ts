import { ResourceNotFoundError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  MARKETPLACE_REPOSITORY,
  type MarketplaceRepository,
} from "@/modules/marketplaces/application/ports/marketplace.repository.port";
import type { Marketplace } from "@/modules/marketplaces/domain/marketplace";

export interface GetMarketplaceInput {
  ownerId: string;
  slug: string;
}

@Injectable()
export class GetMarketplaceUseCase {
  constructor(
    @Inject(MARKETPLACE_REPOSITORY)
    private readonly marketplaces: MarketplaceRepository,
  ) {}

  async execute(input: GetMarketplaceInput): Promise<Marketplace> {
    const marketplace = await this.marketplaces.findByOwnerAndSlug(
      input.ownerId,
      input.slug,
    );

    // Someone else's marketplace looks exactly like one that does not exist.
    if (!marketplace) {
      throw new ResourceNotFoundError("Marketplace not found");
    }

    return marketplace;
  }
}
