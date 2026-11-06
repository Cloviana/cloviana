import { Inject, Injectable } from "@nestjs/common";

import {
  COLLECTION_REPOSITORY,
  type CollectionRepository,
} from "@/modules/catalog/application/ports/collection.repository.port";
import type {
  CollectionListInput,
  CollectionPage,
} from "@/modules/catalog/domain/collection";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";

export interface ListCollectionsInput extends Partial<CollectionListInput> {
  ownerId: string;
  slug: string;
}

@Injectable()
export class ListCollectionsUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(COLLECTION_REPOSITORY)
    private readonly collections: CollectionRepository,
  ) {}

  async execute(input: ListCollectionsInput): Promise<CollectionPage> {
    const marketplace = await this.getMarketplace.execute(input);
    const search = input.search?.trim().toLowerCase() || undefined;

    return this.collections.findPage(marketplace.id, {
      search,
      limit: input.limit ?? (search ? 20 : 50),
      offset: input.offset ?? 0,
    });
  }
}
