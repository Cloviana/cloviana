import { ResourceNotFoundError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from "@/modules/catalog/application/ports/product.repository.port";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";

@Injectable()
export class ArchiveProductUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async execute(input: {
    ownerId: string;
    slug: string;
    productId: string;
  }): Promise<void> {
    const marketplace = await this.getMarketplace.execute(input);
    if (!(await this.products.archive(marketplace.id, input.productId))) {
      throw new ResourceNotFoundError("Product not found");
    }
  }
}
