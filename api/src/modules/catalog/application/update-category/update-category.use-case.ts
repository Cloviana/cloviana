import {
  ResourceNotFoundError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import { isHandleConflict } from "@/modules/catalog/application/handle";
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from "@/modules/catalog/application/ports/category.repository.port";
import type { Category } from "@/modules/catalog/domain/category";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import { CategoryCache } from "../ports/category-cache.port";

export interface UpdateCategoryInput {
  ownerId: string;
  slug: string;
  categoryId: string;
  expectedUpdatedAt: string;
  name: string;
  handle: string;
  parentId?: string | null;
  description?: string | null;
  isActive: boolean;
  isInternal: boolean;
}

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    private readonly cache: CategoryCache,
  ) {}

  async execute(input: UpdateCategoryInput): Promise<Category> {
    const marketplace = await this.getMarketplace.execute({
      ownerId: input.ownerId,
      slug: input.slug,
    });
    const before = await this.categories.findById(
      marketplace.id,
      input.categoryId,
      { includeHidden: true },
    );
    if (!before) {
      throw new ResourceNotFoundError("Category not found");
    }

    let category: Category;
    try {
      category = await this.categories.update({
        marketplaceId: marketplace.id,
        id: input.categoryId,
        expectedUpdatedAt: input.expectedUpdatedAt,
        name: input.name,
        handle: input.handle,
        parentId: input.parentId ?? null,
        description: input.description || null,
        isActive: input.isActive,
        isInternal: input.isInternal,
      });
    } catch (error) {
      if (isHandleConflict(error)) {
        throw new StateConflictError(
          "A category with this handle already exists.",
        );
      }
      throw error;
    }

    // The category itself, and the parents it left and joined (their "has subcategories" can change).
    await this.cache.forget(marketplace.id, [
      category.id,
      before.parentId,
      category.parentId,
    ]);
    return category;
  }
}
