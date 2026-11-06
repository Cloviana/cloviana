import { InvalidInputError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from "@/modules/catalog/application/ports/category.repository.port";
import type {
  CategoryListInput,
  CategoryPage,
} from "@/modules/catalog/domain/category";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";

export interface ListCategoriesInput extends Partial<CategoryListInput> {
  ownerId: string;
  slug: string;
}

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async execute(input: ListCategoriesInput): Promise<CategoryPage> {
    const marketplace = await this.getMarketplace.execute(input);
    const search = input.search?.trim().toLowerCase() || undefined;
    if (search && input.parentId) {
      throw new InvalidInputError("Use either parentId or search, not both");
    }
    const params: CategoryListInput = {
      parentId: input.parentId?.toLowerCase(),
      search,
      includeHidden: input.includeHidden ?? false,
      limit: input.limit ?? (search ? 20 : 50),
      offset: input.offset ?? 0,
    };
    return this.categories.findPage(marketplace.id, params);
  }
}
