import { Inject, Injectable } from "@nestjs/common";

import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from "@/modules/catalog/application/ports/product.repository.port";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";

@Injectable()
export class DeleteProductsUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async execute(input: {
    ownerId: string;
    slug: string;
    ids: string[];
  }): Promise<{ deleted: number; skipped: number }> {
    const marketplace = await this.getMarketplace.execute(input);
    const deleted = await this.products.deleteMany(marketplace.id, input.ids);
    return { deleted, skipped: input.ids.length - deleted };
  }
}
