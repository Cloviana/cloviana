export interface SellerMembership {
  sellerId: string;
  roleId: string;
  isOwner: boolean;
}

export interface Member {
  id: string;
  marketplaceId: string;
  marketplaceUserId: string;
  email: string;
  isActive: boolean;
  sellers: SellerMembership[];
}
