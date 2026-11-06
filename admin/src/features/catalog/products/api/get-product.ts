import 'server-only';

import { ApiError, api } from '@/lib/api/api-client';

import type { ProductDetail } from '../types';

// null when the product does not exist in this marketplace (the API answers 404).
export async function getProduct(marketplaceSlug: string, productId: string) {
  try {
    return await api.get<ProductDetail>(
      `/marketplaces/${encodeURIComponent(marketplaceSlug)}/products/${encodeURIComponent(productId)}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
