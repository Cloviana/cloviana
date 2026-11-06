import { Inject, Injectable } from "@nestjs/common";

import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from "@/modules/catalog/application/ports/product.repository.port";
import type { BulkProductStatus } from "@/modules/catalog/domain/product";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";

@Injectable()
export class SetProductsStatusUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async execute(input: {
    ownerId: string;
    slug: string;
    ids: string[];
    status: BulkProductStatus;
  }): Promise<{ updated: number }> {
    const marketplace = await this.getMarketplace.execute(input);
    return {
      updated: await this.products.setStatus(
        marketplace.id,
        input.ids,
        input.status,
      ),
    };
  }
}
