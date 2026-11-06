import type { Category } from "../../domain/category";

export abstract class CategoryCache {
  abstract remember(
    marketplaceId: string,
    categoryId: string,
    load: () => Promise<Category>,
  ): Promise<Category>;
  abstract forget(
    marketplaceId: string,
    categoryIds: Array<string | null | undefined>,
  ): Promise<void>;
}
