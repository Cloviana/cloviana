export const CREATABLE_PRODUCT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "UNLISTED",
] as const;
export type CreateProductStatus = (typeof CREATABLE_PRODUCT_STATUSES)[number];
export type ProductStatus =
  | CreateProductStatus
  | "PROPOSED"
  | "REJECTED"
  | "ARCHIVED";
export const PRODUCT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "UNLISTED",
  "PROPOSED",
  "REJECTED",
  "ARCHIVED",
] as const;
export const BULK_PRODUCT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "UNLISTED",
  "ARCHIVED",
] as const;
export type BulkProductStatus = (typeof BULK_PRODUCT_STATUSES)[number];

export interface Product {
  id: string;
  marketplaceId: string;
  title: string;
  handle: string;
  subtitle: string | null;
  description: string | null;
  status: ProductStatus;
  thumbnail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductListItem extends Product {
  category: { id: string; name: string } | null;
  offerCount: number;
}

/** Search and filters for one page of the products list. Dates are ISO timestamps; a `category` of "none" means uncategorized. */
export interface ProductListQuery {
  page: number;
  pageSize: number;
  q?: string;
  status?: ProductStatus[];
  offers?: "has" | "none";
  category?: string[];
  updatedFrom?: string;
  updatedTo?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface ProductPage {
  items: ProductListItem[];
  /** Products matching the query across all pages. */
  total: number;
}

export interface CreateProductRecord {
  marketplaceId: string;
  title: string;
  status: CreateProductStatus;
  handle: string;
  subtitle?: string;
  description?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  variants?: ProductVariantEdit[];
  categoryId?: string;
  collectionIds?: string[];
  options?: ProductOptionInput[];
  offers: ProductOfferInput[];
  images: { assetId: string }[];
}

export interface ProductVariantEdit {
  key: string;
  title?: string | null;
  sku?: string | null;
}

export interface ProductOptionInput {
  persistedId?: string;
  valueIds?: (string | null)[];
  valueKeys?: string[];
  name: string;
  values: string[];
}

export interface ProductOfferInput {
  sellerId: string;
  variantKey: string;
  sku?: string;
  price: string;
  initialStock: number;
}

export interface ProductDetail extends Product {
  canDelete: boolean;
  categoryId: string | null;
  collectionIds: string[];
  media: { id: string; assetId: string; url: string }[];
  options: ProductOptionInput[];
  seoTitle: string | null;
  seoDescription: string | null;
  variants: {
    id: string;
    key: string;
    title: string;
    customTitle: string | null;
    sku: string | null;
  }[];
  offers: {
    id: string;
    persistedId: string;
    seller: {
      id: string;
      name: string;
      handle: string;
      logo?: string | null;
      currencyCode: string;
    };
    variantKey: string;
    price: string;
    stock: string;
    sku: string;
    inventoryUpdatedAt: string | null;
    quantityEditable: boolean;
  }[];
}

export interface UpdateProductRecord {
  marketplaceId: string;
  productId: string;
  expectedUpdatedAt: string;
  title: string;
  description: string;
  handle?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  variants?: ProductVariantEdit[];
  status: ProductStatus;
  categoryId: string | null;
  collectionIds: string[];
  options: ProductOptionInput[];
  media: ({ id: string } | { assetId: string })[];
  offers?: {
    persistedId?: string;
    sellerId: string;
    variantKey: string;
    price: string;
    quantity?: number;
    inventoryUpdatedAt?: string | null;
  }[];
}
