import { infiniteQueryOptions } from '@tanstack/react-query';

import { listAttributesAction } from './actions/list-attributes';
import type { AttributeListParams } from './types';

const STALE_TIME = 5 * 60 * 1000;

export const attributeKeys = {
  all: (slug: string) => ['attributes', slug] as const,
  lists: (slug: string) => [...attributeKeys.all(slug), 'list'] as const,
  pages: (slug: string, params: AttributeListParams) =>
    [
      ...attributeKeys.lists(slug),
      { ...params, isVariantAxis: true },
      'pages',
    ] as const,
};

export const attributePagesQueryOptions = (
  slug: string,
  input: Omit<AttributeListParams, 'offset'> = {},
) => {
  const search = input.search?.trim().toLowerCase() || undefined;
  const params = {
    search,
    limit: input.limit ?? (search ? 20 : 50),
    offset: 0,
  };

  return infiniteQueryOptions({
    queryKey: attributeKeys.pages(slug, params),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listAttributesAction(slug, { ...params, offset: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: STALE_TIME,
  });
};
