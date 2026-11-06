import { InvalidInputError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import {
  SELLER_REPOSITORY,
  type SellerRepository,
} from "@/modules/vendors/application/ports/seller.repository.port";
import type { SellerChanges } from "@/modules/vendors/domain/seller";

@Injectable()
export class UpdateSellersUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(SELLER_REPOSITORY) private readonly sellers: SellerRepository,
  ) {}

  async execute(
    input: SellerChanges & { ownerId: string; slug: string; ids: string[] },
  ): Promise<{ updated: number }> {
    if (input.status === undefined && input.featured === undefined) {
      throw new InvalidInputError("Provide status or featured");
    }
    const marketplace = await this.getMarketplace.execute(input);
    return {
      updated: await this.sellers.updateMany(marketplace.id, input.ids, {
        status: input.status,
        featured: input.featured,
      }),
    };
  }
}
