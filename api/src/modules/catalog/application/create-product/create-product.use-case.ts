import { randomInt } from "node:crypto";
import {
  InvalidInputError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  isHandleConflict,
  slugify,
} from "@/modules/catalog/application/handle";
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from "@/modules/catalog/application/ports/product.repository.port";
import {
  assertUniqueVariantSkus,
  isSkuConflict,
} from "@/modules/catalog/application/variant-sku";
import type {
  CreateProductStatus,
  Product,
  ProductOfferInput,
  ProductOptionInput,
  ProductVariantEdit,
} from "@/modules/catalog/domain/product";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import {
  assertValidVariantAssignments,
  getProductVariants,
} from "../../domain/product-variants";

export interface CreateProductInput {
  ownerId: string;
  slug: string;
  title: string;
  status?: CreateProductStatus;
  handle?: string;
  subtitle?: string;
  description?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  variants?: ProductVariantEdit[];
  categoryId?: string;
  collectionIds?: string[];
  options?: ProductOptionInput[];
  offers: ProductOfferInput[];
  mediaItems?: { assetId: string }[];
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const marketplace = await this.getMarketplace.execute(input);
    assertUniqueVariantSkus(input.variants);
    assertValidVariantAssignments(
      getProductVariants(input.options),
      input.variants,
      input.offers,
    );
    const base = input.handle ?? slugify(input.title, "product");
    const images = input.mediaItems ?? [];
    const assetIds = images.map((item) => item.assetId);
    if (new Set(assetIds).size !== assetIds.length) {
      throw new InvalidInputError("Choose each library asset once.");
    }
    try {
      // The database is the source of truth for handle uniqueness. A handle the caller chose
      // is theirs to fix (409); a derived one gets a random suffix and is retried.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const handle =
          attempt === 0 ? base : `${base}-${randomInt(1000, 10000)}`;

        try {
          const product = await this.products.create({
            marketplaceId: marketplace.id,
            title: input.title,
            status: input.status ?? "DRAFT",
            handle,
            subtitle: input.subtitle,
            description: input.description,
            seoTitle: input.seoTitle,
            seoDescription: input.seoDescription,
            variants: input.variants,
            categoryId: input.categoryId,
            collectionIds: input.collectionIds,
            options: input.options,
            offers: input.offers,
            images,
          });
          return product;
        } catch (error) {
          if (!isHandleConflict(error)) {
            throw error;
          }
          if (input.handle) {
            break;
          }
        }
      }

      throw new StateConflictError("A product with this handle already exists");
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
