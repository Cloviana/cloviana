import { ResourceNotFoundError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  COLLECTION_REPOSITORY,
  type CollectionRepository,
} from "@/modules/catalog/application/ports/collection.repository.port";
import type { Collection } from "@/modules/catalog/domain/collection";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";

export interface GetCollectionInput {
  ownerId: string;
  slug: string;
  collectionId: string;
}

@Injectable()
export class GetCollectionUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(COLLECTION_REPOSITORY)
    private readonly collections: CollectionRepository,
  ) {}

  async execute(input: GetCollectionInput): Promise<Collection> {
    const marketplace = await this.getMarketplace.execute(input);
    const collection = await this.collections.findById(
      marketplace.id,
      input.collectionId,
    );

    if (!collection) {
      throw new ResourceNotFoundError("Collection not found");
    }

    return collection;
  }
}
