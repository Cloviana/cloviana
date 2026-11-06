import { ResourceNotFoundError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from "@/modules/catalog/application/ports/category.repository.port";
import type { CategoryImpact } from "@/modules/catalog/domain/category";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";

@Injectable()
export class GetCategoryImpactUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  /** What deleting the category would also remove. */
  async execute(input: {
    ownerId: string;
    slug: string;
    categoryId: string;
  }): Promise<CategoryImpact> {
    const marketplace = await this.getMarketplace.execute({
      ownerId: input.ownerId,
      slug: input.slug,
    });
    const impact = await this.categories.getImpact(
      marketplace.id,
      input.categoryId,
    );
    if (!impact) {
      throw new ResourceNotFoundError("Category not found");
    }
    return impact;
  }
}
