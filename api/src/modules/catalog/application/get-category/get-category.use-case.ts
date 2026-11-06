import { ResourceNotFoundError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from "@/modules/catalog/application/ports/category.repository.port";
import type { Category } from "@/modules/catalog/domain/category";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import { CategoryCache } from "../ports/category-cache.port";

export interface GetCategoryInput {
  ownerId: string;
  slug: string;
  categoryId: string;
  /** The dashboard's view: includes inactive and internal categories, and is never served from the cache. */
  includeHidden?: boolean;
}

@Injectable()
export class GetCategoryUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    private readonly cache: CategoryCache,
  ) {}

  async execute(input: GetCategoryInput): Promise<Category> {
    const marketplace = await this.getMarketplace.execute(input);
    const categoryId = input.categoryId.toLowerCase();
    if (input.includeHidden) {
      const category = await this.categories.findById(
        marketplace.id,
        categoryId,
        { includeHidden: true },
      );
      if (!category) {
        throw new ResourceNotFoundError("Category not found");
      }
      return category;
    }
    return this.cache.remember(marketplace.id, categoryId, async () => {
      const category = await this.categories.findById(
        marketplace.id,
        categoryId,
      );
      if (!category) {
        throw new ResourceNotFoundError("Category not found");
      }
      return category;
    });
  }
}
