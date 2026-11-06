import type { AttributeListInput, AttributePage } from "../../domain/attribute";

export const ATTRIBUTE_REPOSITORY = Symbol("ATTRIBUTE_REPOSITORY");

export interface AttributeRepository {
  findPage(
    marketplaceId: string,
    input: AttributeListInput,
  ): Promise<AttributePage>;
}
