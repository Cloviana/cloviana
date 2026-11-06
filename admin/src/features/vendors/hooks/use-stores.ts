'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useFilters } from '@/hooks/use-filters';

import { storeFilters, toStoresParams } from '../lib/store-filters';
import { storesQueryOptions } from '../queries';

/** One page of the marketplace's stores, for the search, filters and page in the URL. */
export function useStores(marketplaceSlug: string) {
  const { query, values, page } = useFilters(storeFilters);
  const params = useMemo(
    () => toStoresParams({ query, values, page }),
    [query, values, page],
  );
  return useQuery(storesQueryOptions(marketplaceSlug, params));
}
