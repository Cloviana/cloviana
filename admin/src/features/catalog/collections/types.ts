export type Collection = {
  id: string;
  title: string;
  handle: string;
};

export type CollectionListParams = {
  search?: string;
  limit?: number;
  offset?: number;
};

export type CollectionPage = {
  items: Collection[];
  nextOffset: number | null;
};
