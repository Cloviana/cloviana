import {
  InvalidInputError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import type { ProductRepository } from "@/modules/catalog/application/ports/product.repository.port";
import { PRODUCT_REPOSITORY } from "@/modules/catalog/application/ports/product.repository.port";
import {
  assertUniqueVariantSkus,
  isSkuConflict,
} from "@/modules/catalog/application/variant-sku";
import type { UpdateProductRecord } from "@/modules/catalog/domain/product";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import {
  assertValidVariantAssignments,
  getProductVariants,
} from "../../domain/product-variants";

export type UpdateProductInput = Omit<
  UpdateProductRecord,
  "marketplaceId" | "categoryId" | "media"
> & {
  ownerId: string;
  slug: string;
  categoryId?: string | null;
  media: Array<{ id?: string; assetId?: string }>;
};

@Injectable()
export class UpdateProductUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async execute(input: UpdateProductInput) {
    const marketplace = await this.getMarketplace.execute(input);
    assertUniqueVariantSkus(input.variants);
    assertValidVariantAssignments(
      getProductVariants(input.options),
      input.variants,
      input.offers,
    );
    const media: ({ id: string } | { assetId: string })[] = [];
    for (const item of input.media) {
      if ([item.id, item.assetId].filter(Boolean).length !== 1) {
        throw new InvalidInputError(
          "Choose an existing product image or a library file.",
        );
      }
      // biome-ignore lint/style/noNonNullAssertion: checked above: an item without id has assetId
      media.push(item.id ? { id: item.id } : { assetId: item.assetId! });
    }
    const assetIds = input.media.flatMap((item) =>
      item.assetId ? [item.assetId] : [],
    );
    if (new Set(assetIds).size !== assetIds.length) {
      throw new InvalidInputError("Choose each library asset once.");
    }
    try {
      const product = await this.products.update({
        marketplaceId: marketplace.id,
        productId: input.productId,
        expectedUpdatedAt: input.expectedUpdatedAt,
        title: input.title,
        description: input.description,
        status: input.status,
        categoryId: input.categoryId ?? null,
        handle: input.handle,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        variants: input.variants,
        collectionIds: input.collectionIds,
        options: input.options,
        offers: input.offers,
        media,
      });
      return product;
    } catch (error) {
      if (isSkuConflict(error)) {
        throw new StateConflictError(
          "A variant with this SKU already exists in this marketplace.",
        );
      }
      throw error;
    }
  }
}
