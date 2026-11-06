import { Inject, Injectable } from "@nestjs/common";

import {
  ATTRIBUTE_REPOSITORY,
  type AttributeRepository,
} from "@/modules/catalog/application/ports/attribute.repository.port";
import type {
  AttributeListInput,
  AttributePage,
} from "@/modules/catalog/domain/attribute";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";

export interface ListAttributesInput extends Partial<AttributeListInput> {
  ownerId: string;
  slug: string;
}

@Injectable()
export class ListAttributesUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(ATTRIBUTE_REPOSITORY)
    private readonly attributes: AttributeRepository,
  ) {}

  async execute(input: ListAttributesInput): Promise<AttributePage> {
    const marketplace = await this.getMarketplace.execute(input);
    const search = input.search?.trim().toLowerCase() || undefined;

    return this.attributes.findPage(marketplace.id, {
      search,
      limit: input.limit ?? (search ? 20 : 50),
      offset: input.offset ?? 0,
    });
  }
}
