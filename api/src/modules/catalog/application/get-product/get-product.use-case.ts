import { ResourceNotFoundError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from "@/modules/catalog/application/ports/product.repository.port";
import type { ProductDetail } from "@/modules/catalog/domain/product";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";

export interface GetProductInput {
  ownerId: string;
  slug: string;
  productId: string;
}

@Injectable()
export class GetProductUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async execute(input: GetProductInput): Promise<ProductDetail> {
    const marketplace = await this.getMarketplace.execute(input);
    const product = await this.products.findById(
      marketplace.id,
      input.productId,
    );

    if (!product) {
      throw new ResourceNotFoundError("Product not found");
    }

    return product;
  }
}
