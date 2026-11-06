export interface CategoryPathEntry {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  handle: string;
  parentId: string | null;
  path: CategoryPathEntry[];
  hasChildren: boolean;
  isActive: boolean;
  isInternal: boolean;
  description: string | null;
  updatedAt: Date;
  /** Products linked directly to this category, not to its subcategories. */
  productCount: number;
}

export interface CategoryListInput {
  parentId?: string;
  search?: string;
  /** Also list inactive and internal categories (the dashboard does; the storefront and product picker don't). */
  includeHidden?: boolean;
  limit: number;
  offset: number;
}

export interface CategoryPage {
  items: Category[];
  nextOffset: number | null;
}

export interface CreateCategoryRecord {
  marketplaceId: string;
  name: string;
  handle: string;
  parentId?: string;
  description?: string;
  isActive: boolean;
  isInternal: boolean;
}

export interface UpdateCategoryRecord {
  marketplaceId: string;
  id: string;
  /** The `updatedAt` the editor loaded; a different value means someone else saved in between. */
  expectedUpdatedAt: string;
  name: string;
  handle: string;
  parentId: string | null;
  description: string | null;
  isActive: boolean;
  isInternal: boolean;
}

/** What deleting a category also removes: its descendants, and how many products lose a category. */
export interface CategoryImpact {
  subcategories: number;
  products: number;
}
