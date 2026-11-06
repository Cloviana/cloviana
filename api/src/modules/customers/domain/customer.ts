export interface Customer {
  id: string;
  marketplaceId: string;
  marketplaceUserId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface EnsureCustomerRecord {
  marketplaceId: string;
  marketplaceUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}
