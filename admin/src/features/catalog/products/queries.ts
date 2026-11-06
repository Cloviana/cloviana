import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { listProductsAction } from './actions/list-products';
import { toRequestParams } from './lib/product-filters';
import type { ProductListParams } from './types';

// Keys nest by marketplace so a mutation can invalidate `productKeys.lists(slug)` at once.
export const productKeys = {
  all: (slug: string) => ['products', slug] as const,
  lists: (slug: string) => [...productKeys.all(slug), 'list'] as const,
  list: (slug: string, params: ProductListParams) =>
    [...productKeys.lists(slug), params] as const,
};

// While another page or filter loads, the rows already on screen stay (as placeholder data).
export const productsQueryOptions = (slug: string, params: ProductListParams) =>
  queryOptions({
    queryKey: productKeys.list(slug, params),
    queryFn: () => listProductsAction(slug, toRequestParams(params)),
    placeholderData: keepPreviousData,
  });
