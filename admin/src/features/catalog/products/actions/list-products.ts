'use server';

import { listProducts } from '../api/list-products';
import type { ProductListParams } from '../types';

// The React Query queryFn: the browser never holds the API token, so reads go through the server.
export async function listProductsAction(
  marketplaceSlug: string,
  params: ProductListParams,
) {
  return listProducts(marketplaceSlug, params);
}
