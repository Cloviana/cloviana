import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { getCollectionAction } from './actions/get-collection';
import { listCollectionsAction } from './actions/list-collections';
import type { CollectionListParams } from './types';

const STALE_TIME = 5 * 60 * 1000;

export const collectionKeys = {
  all: (slug: string) => ['collections', slug] as const,
  lists: (slug: string) => [...collectionKeys.all(slug), 'list'] as const,
  list: (slug: string, params: CollectionListParams) =>
    [...collectionKeys.lists(slug), params] as const,
  pages: (slug: string, params: CollectionListParams) =>
    [...collectionKeys.list(slug, params), 'pages'] as const,
  detail: (slug: string, id: string) =>
    [...collectionKeys.all(slug), 'detail', id] as const,
};

function normalizeCollectionParams(input: CollectionListParams) {
  const search = input.search?.trim().toLowerCase() || undefined;
  return {
    search,
    limit: input.limit ?? (search ? 20 : 50),
    offset: input.offset ?? 0,
  };
}

export const collectionsQueryOptions = (
  slug: string,
  input: CollectionListParams = {},
) => {
  const params = normalizeCollectionParams(input);
  return queryOptions({
    queryKey: collectionKeys.list(slug, params),
    queryFn: () => listCollectionsAction(slug, params),
    staleTime: STALE_TIME,
  });
};

export const collectionPagesQueryOptions = (
  slug: string,
  input: Omit<CollectionListParams, 'offset'> = {},
) => {
  const params = normalizeCollectionParams({ ...input, offset: 0 });
  return infiniteQueryOptions({
    queryKey: collectionKeys.pages(slug, params),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listCollectionsAction(slug, { ...params, offset: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: STALE_TIME,
  });
};

export const collectionQueryOptions = (slug: string, id: string) => {
  const collectionId = id.toLowerCase();
  return queryOptions({
    queryKey: collectionKeys.detail(slug, collectionId),
    queryFn: () => getCollectionAction(slug, collectionId),
    staleTime: STALE_TIME,
  });
};
