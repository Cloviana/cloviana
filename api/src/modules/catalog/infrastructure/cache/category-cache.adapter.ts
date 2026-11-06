import { AppCacheService } from "@/platform/cache/cache.service";
import { Injectable } from "@nestjs/common";
import { CategoryCache } from "../../application/ports/category-cache.port";
import type { Category } from "../../domain/category";

const CATEGORY_DETAIL_TTL = 60 * 60 * 1000;

@Injectable()
export class CategoryCacheAdapter extends CategoryCache {
  constructor(private readonly cache: AppCacheService) {
    super();
  }

  private key(marketplaceId: string, categoryId: string) {
    return this.cache.buildKey("categories:detail", {
      marketplaceId,
      categoryId: categoryId.toLowerCase(),
    });
  }

  remember(
    marketplaceId: string,
    categoryId: string,
    load: () => Promise<Category>,
  ) {
    return this.cache.remember({
      key: this.key(marketplaceId, categoryId),
      ttl: CATEGORY_DETAIL_TTL,
      loader: load,
    });
  }

  async forget(
    marketplaceId: string,
    categoryIds: Array<string | null | undefined>,
  ) {
    const ids = [
      ...new Set(categoryIds.filter((id): id is string => Boolean(id))),
    ];
    await Promise.all(
      ids.map((id) => this.cache.delete(this.key(marketplaceId, id))),
    );
  }
}
