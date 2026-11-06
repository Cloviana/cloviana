export type AttributeValue = {
  id: string;
  name: string;
};

export type VariantAttribute = {
  id: string;
  name: string;
  values: AttributeValue[];
};

export type AttributeListParams = {
  search?: string;
  limit?: number;
  offset?: number;
};

export type AttributePage = {
  items: VariantAttribute[];
  nextOffset: number | null;
};
