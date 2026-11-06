import { randomInt } from "node:crypto";
import {
  ResourceNotFoundError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  isHandleConflict,
  slugify,
} from "@/modules/catalog/application/handle";
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from "@/modules/catalog/application/ports/category.repository.port";
import type { Category } from "@/modules/catalog/domain/category";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";

export interface CreateCategoryInput {
  ownerId: string;
  slug: string;
  name: string;
  handle?: string;
  parentId?: string;
  description?: string;
  isActive?: boolean;
  isInternal?: boolean;
}

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    const marketplace = await this.getMarketplace.execute({
      ownerId: input.ownerId,
      slug: input.slug,
    });

    // A category can sit under an inactive or internal parent, so hidden ones count here.
    if (
      input.parentId &&
      !(await this.categories.findById(marketplace.id, input.parentId, {
        includeHidden: true,
      }))
    ) {
      throw new ResourceNotFoundError("Parent category not found");
    }

    // The database is the source of truth for handle uniqueness. A handle the caller chose
    // is theirs to fix (409); a derived one gets a random suffix and is retried.
    const base = input.handle ?? slugify(input.name, "category");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const handle = attempt === 0 ? base : `${base}-${randomInt(1000, 10000)}`;

      try {
        return await this.categories.create({
          marketplaceId: marketplace.id,
          name: input.name,
          handle,
          parentId: input.parentId,
          description: input.description || undefined,
          isActive: input.isActive ?? true,
          isInternal: input.isInternal ?? false,
        });
      } catch (error) {
        if (!isHandleConflict(error)) {
          throw error;
        }
        if (input.handle) {
          break;
        }
      }
    }

    throw new StateConflictError("A category with this handle already exists");
  }
}
