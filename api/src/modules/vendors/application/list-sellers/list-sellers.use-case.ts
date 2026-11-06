import { Inject, Injectable } from "@nestjs/common";

import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import {
  SELLER_REPOSITORY,
  type SellerRepository,
} from "@/modules/vendors/application/ports/seller.repository.port";
import type {
  SellerListInput,
  SellerPage,
} from "@/modules/vendors/domain/seller";

export interface ListSellersInput extends Partial<SellerListInput> {
  ownerId: string;
  slug: string;
}

@Injectable()
export class ListSellersUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(SELLER_REPOSITORY) private readonly sellers: SellerRepository,
  ) {}

  async execute(input: ListSellersInput): Promise<SellerPage> {
    const marketplace = await this.getMarketplace.execute(input);
    const search = input.search?.trim().toLowerCase() || undefined;

    return this.sellers.findPage(marketplace.id, {
      search,
      status: input.status ?? "ACTIVE",
      limit: input.limit ?? (search ? 20 : 50),
      offset: input.offset ?? 0,
    });
  }
}
