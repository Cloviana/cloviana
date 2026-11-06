import type {
  BulkProductStatus,
  CreateProductRecord,
  Product,
  ProductDetail,
  ProductListQuery,
  ProductPage,
  UpdateProductRecord,
} from "../../domain/product";

export const PRODUCT_REPOSITORY = Symbol("PRODUCT_REPOSITORY");

export interface ProductRepository {
  create(input: CreateProductRecord): Promise<Product>;
  findByMarketplace(
    marketplaceId: string,
    query: ProductListQuery,
  ): Promise<ProductPage>;
  update(input: UpdateProductRecord): Promise<ProductDetail>;
  findById(marketplaceId: string, id: string): Promise<ProductDetail | null>;
  archive(marketplaceId: string, id: string): Promise<boolean>;
  setStatus(
    marketplaceId: string,
    ids: string[],
    status: BulkProductStatus,
  ): Promise<number>;
  deleteMany(marketplaceId: string, ids: string[]): Promise<number>;
  delete(
    marketplaceId: string,
    id: string,
  ): Promise<"deleted" | "not_found" | "not_deletable">;
  unarchive(
    marketplaceId: string,
    id: string,
  ): Promise<"updated" | "not_found" | "not_archived">;
}
