export interface AttributeValue {
  id: string;
  name: string;
}

export interface VariantAttribute {
  id: string;
  name: string;
  values: AttributeValue[];
}

export interface AttributeListInput {
  search?: string;
  limit: number;
  offset: number;
}

export interface AttributePage {
  items: VariantAttribute[];
  nextOffset: number | null;
}
