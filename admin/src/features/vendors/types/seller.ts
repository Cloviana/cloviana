export type Seller = {
  id: string;
  name: string;
  handle: string;
  logo?: string | null;
  currencyCode: string;
};

export type SellerListParams = {
  search?: string;
  limit?: number;
  offset?: number;
};

export type SellerPage = {
  items: Seller[];
  nextOffset: number | null;
};

export type StoreStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

export type StoreInviteStatus = 'pending' | 'accepted' | 'expired';

export type StoreListItem = Seller & {
  email: string;
  phone: string | null;
  status: StoreStatus;
  featured: boolean;
  createdAt: string;
  adminInvite: { email: string; status: StoreInviteStatus } | null;
};

export type StorePage = {
  items: StoreListItem[];
  /** Stores matching the search and status across all pages. */
  total: number;
};

/** Query parameters of the stores list. */
export type StoreListParams = {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
};

/** What a bulk update can change. At least one is set. */
export type StoreChanges = {
  status?: 'ACTIVE' | 'SUSPENDED';
  featured?: boolean;
};
