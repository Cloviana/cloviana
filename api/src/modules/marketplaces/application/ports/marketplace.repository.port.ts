import type {
  CreateMarketplaceRecord,
  Marketplace,
} from "../../domain/marketplace";

export const MARKETPLACE_REPOSITORY = Symbol("MARKETPLACE_REPOSITORY");

export interface MarketplaceRepository {
  /** Creates the marketplace together with its defaults, all or nothing. */
  create(input: CreateMarketplaceRecord): Promise<Marketplace>;
  findByOwner(ownerId: string): Promise<Marketplace[]>;
  findByOwnerAndSlug(
    ownerId: string,
    slug: string,
  ): Promise<Marketplace | null>;
}
