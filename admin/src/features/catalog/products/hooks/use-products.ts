'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useFilters } from '@/hooks/use-filters';

import { productFilters, toProductsParams } from '../lib/product-filters';
import { productsQueryOptions } from '../queries';

/** One page of the marketplace's products, for the search, filters and page in the URL. */
export function useProducts(marketplaceSlug: string) {
  const { query, values, page } = useFilters(productFilters);
  const params = useMemo(
    () => toProductsParams({ query, values, page }),
    [query, values, page],
  );
  return useQuery(productsQueryOptions(marketplaceSlug, params));
}
