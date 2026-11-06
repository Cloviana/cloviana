import type {
  NewOwnerInvite,
  NewSeller,
  Seller,
  SellerChanges,
  SellerListInput,
  SellerPage,
} from "../../domain/seller";

export const SELLER_REPOSITORY = Symbol("SELLER_REPOSITORY");

export interface SellerRepository {
  findPage(marketplaceId: string, input: SellerListInput): Promise<SellerPage>;
  /** Creates the seller and its owner invite in one transaction. Throws SellerHandleConflictError on a taken handle. */
  createWithOwnerInvite(
    seller: NewSeller,
    invite: NewOwnerInvite,
  ): Promise<Seller>;
  /** Expires the seller's open owner invites and issues a new one. Null when the seller is not in this marketplace. */
  replaceOwnerInvite(
    marketplaceId: string,
    sellerId: string,
    invite: NewOwnerInvite,
    now: Date,
  ): Promise<Seller | null>;
  hasOwner(marketplaceId: string, sellerId: string): Promise<boolean>;
  /** Applies the changes to these sellers and returns how many changed. Terminated sellers are never touched. */
  updateMany(
    marketplaceId: string,
    ids: string[],
    changes: SellerChanges,
  ): Promise<number>;
}
