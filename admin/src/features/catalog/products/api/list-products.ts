import 'server-only';

import { api } from '@/lib/api/api-client';

import type { ProductListParams, ProductPage } from '../types';

export function listProducts(
  marketplaceSlug: string,
  params: ProductListParams,
) {
  return api.get<ProductPage>(
    `/marketplaces/${encodeURIComponent(marketplaceSlug)}/products`,
    { params },
  );
}
