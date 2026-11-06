import { infiniteQueryOptions } from '@tanstack/react-query';

import { listSellersAction } from '../actions/list-sellers';
import type { SellerListParams } from '../types/seller';

export const sellerKeys = {
  all: (slug: string) => ['sellers', slug] as const,
  pages: (slug: string, params: SellerListParams) =>
    [...sellerKeys.all(slug), 'list', params, 'pages'] as const,
};

export function sellerPagesQueryOptions(
  slug: string,
  input: Omit<SellerListParams, 'offset'> = {},
) {
  const search = input.search?.trim().toLowerCase() || undefined;
  const params = {
    search,
    limit: input.limit ?? (search ? 20 : 50),
    offset: 0,
  };

  return infiniteQueryOptions({
    queryKey: sellerKeys.pages(slug, params),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listSellersAction(slug, { ...params, offset: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: 5 * 60 * 1000,
  });
}
