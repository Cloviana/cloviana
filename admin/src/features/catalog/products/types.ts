export type ProductStatus =
  | 'DRAFT'
  | 'PROPOSED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'UNLISTED'
  | 'ARCHIVED';

export type BulkProductStatus = Extract<
  ProductStatus,
  'DRAFT' | 'PUBLISHED' | 'UNLISTED' | 'ARCHIVED'
>;

export type Product = {
  id: string;
  title: string;
  handle: string;
  subtitle: string | null;
  description: string | null;
  status: ProductStatus;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductListItem = Product & {
  category: { id: string; name: string } | null;
  offerCount: number;
};

export type ProductPage = {
  items: ProductListItem[];
  /** Products matching the search and filters across all pages. */
  total: number;
};

/** Query parameters of the products list. Lists are comma-separated, and dates are ISO timestamps. */
export type ProductListParams = {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
  offers?: string;
  category?: string;
  updatedFrom?: string;
  updatedTo?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type ProductDetail = Product & {
  canDelete: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string | null;
  collectionIds: string[];
  media: { id: string; assetId: string; url: string }[];
  options: {
    persistedId: string;
    name: string;
    values: string[];
    valueIds: string[];
    valueKeys: string[];
  }[];
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
};
