export type MarketplaceStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";

export interface Marketplace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  status: MarketplaceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMarketplaceRecord {
  name: string;
  slug: string;
  ownerId: string;
  status: MarketplaceStatus;
}
