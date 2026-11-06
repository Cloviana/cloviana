import { Inject, Injectable } from "@nestjs/common";

import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from "@/modules/catalog/application/ports/product.repository.port";
import type {
  ProductListQuery,
  ProductPage,
} from "@/modules/catalog/domain/product";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";

export interface ListProductsInput extends Partial<ProductListQuery> {
  ownerId: string;
  slug: string;
}

@Injectable()
export class ListProductsUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async execute({
    ownerId,
    slug,
    ...query
  }: ListProductsInput): Promise<ProductPage> {
    const marketplace = await this.getMarketplace.execute({ ownerId, slug });

    return this.products.findByMarketplace(marketplace.id, {
      ...query,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 50,
    });
  }
}
