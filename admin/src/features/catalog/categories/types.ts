export type CategoryPathEntry = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
  handle: string;
  parentId: string | null;
  path: CategoryPathEntry[];
  hasChildren: boolean;
  isActive: boolean;
  isInternal: boolean;
  description: string | null;
  updatedAt: string;
  /** Products linked directly to this category, not to its subcategories. */
  productCount: number;
};

export type CategoryListParams = {
  parentId?: string;
  search?: string;
  /** Also list inactive and internal categories, as the dashboard does. */
  includeHidden?: boolean;
  limit?: number;
  offset?: number;
};

export type CategoryPage = {
  items: Category[];
  nextOffset: number | null;
};

/** What deleting a category also removes. */
export type CategoryImpact = {
  subcategories: number;
  products: number;
};
