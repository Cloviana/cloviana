import {
  ResourceNotFoundError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from "@/modules/catalog/application/ports/product.repository.port";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";

@Injectable()
export class UnarchiveProductUseCase {
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
    const result = await this.products.unarchive(
      marketplace.id,
      input.productId,
    );
    if (result === "not_found") {
      throw new ResourceNotFoundError("Product not found");
    }
    if (result === "not_archived") {
      throw new StateConflictError("Product is not archived");
    }
  }
}
