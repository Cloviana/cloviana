import type {
  Collection,
  CollectionListInput,
  CollectionPage,
} from "../../domain/collection";

export const COLLECTION_REPOSITORY = Symbol("COLLECTION_REPOSITORY");

export interface CollectionRepository {
  findPage(
    marketplaceId: string,
    input: CollectionListInput,
  ): Promise<CollectionPage>;
  findById(marketplaceId: string, id: string): Promise<Collection | null>;
}
