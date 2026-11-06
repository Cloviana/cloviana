import type {
  Category,
  CategoryImpact,
  CategoryListInput,
  CategoryPage,
  CreateCategoryRecord,
  UpdateCategoryRecord,
} from "../../domain/category";

export const CATEGORY_REPOSITORY = Symbol("CATEGORY_REPOSITORY");

export interface CategoryRepository {
  findPage(
    marketplaceId: string,
    input: CategoryListInput,
  ): Promise<CategoryPage>;
  findById(
    marketplaceId: string,
    id: string,
    options?: { includeHidden?: boolean },
  ): Promise<Category | null>;
  /** Adds the category after its siblings and returns it, with hidden categories counted as visible. */
  create(input: CreateCategoryRecord): Promise<Category>;
  /** Throws when the category is missing, changed since it was loaded, or would move under itself. */
  update(input: UpdateCategoryRecord): Promise<Category>;
  /** Null when the category does not exist. */
  getImpact(marketplaceId: string, id: string): Promise<CategoryImpact | null>;
  /** Deletes the category and every descendant. Returns the deleted ids, or null when it does not exist. */
  deleteTree(marketplaceId: string, id: string): Promise<string[] | null>;
}
