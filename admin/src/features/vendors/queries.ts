import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { listStoresAction } from './actions/list-stores';
import { sellerKeys } from './api/sellers-query-options';
import type { StoreListParams } from './types/seller';

// Nested under the seller picker's keys, so invalidating `sellerKeys.all(slug)` refreshes both.
export const storeKeys = {
  all: (slug: string) => [...sellerKeys.all(slug), 'stores'] as const,
  list: (slug: string, params: StoreListParams) =>
    [...storeKeys.all(slug), params] as const,
};

// While another page or filter loads, the rows already on screen stay (as placeholder data).
export const storesQueryOptions = (slug: string, params: StoreListParams) =>
  queryOptions({
    queryKey: storeKeys.list(slug, params),
    queryFn: () => listStoresAction(slug, params),
    placeholderData: keepPreviousData,
  });
