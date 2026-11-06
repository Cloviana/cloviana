export type MarketplaceStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export type Marketplace = {
  id: string;
  name: string;
  slug: string;
  status: MarketplaceStatus;
  createdAt: string;
  updatedAt: string;
};
