export type SellerStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "TERMINATED";

export type SellerStatusFilter = SellerStatus | "ALL";

export type AdminInviteStatus = "pending" | "accepted" | "expired";

export interface Seller {
  id: string;
  name: string;
  handle: string;
  logo?: string | null;
  currencyCode: string;
  email: string;
  phone: string | null;
  status: SellerStatus;
  featured: boolean;
  createdAt: Date;
  adminInvite: { email: string; status: AdminInviteStatus } | null;
}

export interface SellerListInput {
  search?: string;
  status: SellerStatusFilter;
  limit: number;
  offset: number;
}

export interface SellerPage {
  items: Seller[];
  nextOffset: number | null;
  /** Sellers matching the search and status across all pages. */
  total: number;
}

export interface SellerChanges {
  status?: "ACTIVE" | "SUSPENDED";
  featured?: boolean;
}

export interface NewSeller {
  marketplaceId: string;
  name: string;
  handle: string;
  email: string;
  phone: string | null;
  currencyCode: string;
}

export interface NewOwnerInvite {
  email: string;
  tokenHash: string;
  expiresAt: Date;
}
