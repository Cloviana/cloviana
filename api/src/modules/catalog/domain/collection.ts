export interface Collection {
  id: string;
  title: string;
  handle: string;
}

export interface CollectionListInput {
  search?: string;
  limit: number;
  offset: number;
}

export interface CollectionPage {
  items: Collection[];
  nextOffset: number | null;
}
