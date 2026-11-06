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
export class DeleteProductUseCase {
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
    const result = await this.products.delete(marketplace.id, input.productId);
    if (result === "not_found") {
      throw new ResourceNotFoundError("Product not found");
    }
    if (result !== "deleted") {
      throw new StateConflictError(
        "Only products with no offers or reviews can be deleted. Archive it instead.",
      );
    }
  }
}
