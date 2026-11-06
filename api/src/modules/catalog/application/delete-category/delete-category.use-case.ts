import { ResourceNotFoundError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from "@/modules/catalog/application/ports/category.repository.port";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import { CategoryCache } from "../ports/category-cache.port";

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    private readonly cache: CategoryCache,
  ) {}

  /** Deletes the category and all its subcategories. Products in them just lose the category. */
  async execute(input: {
    ownerId: string;
    slug: string;
    categoryId: string;
  }): Promise<void> {
    const marketplace = await this.getMarketplace.execute({
      ownerId: input.ownerId,
      slug: input.slug,
    });
    const category = await this.categories.findById(
      marketplace.id,
      input.categoryId,
      { includeHidden: true },
    );
    if (!category) {
      throw new ResourceNotFoundError("Category not found");
    }

    const deleted = await this.categories.deleteTree(
      marketplace.id,
      input.categoryId,
    );
    if (!deleted) {
      throw new ResourceNotFoundError("Category not found");
    }

    // The deleted categories, and the parent that may no longer have subcategories.
    await this.cache.forget(marketplace.id, [...deleted, category.parentId]);
  }
}
