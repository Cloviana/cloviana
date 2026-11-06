import 'server-only';

import { api } from '@/lib/api/api-client';

import type { CreateProductRequest } from '../schemas/product.schema';
import type { Product } from '../types';

export function createProduct(
  marketplaceSlug: string,
  input: CreateProductRequest,
) {
  return api.post<Product>(
    `/marketplaces/${encodeURIComponent(marketplaceSlug)}/products`,
    input,
  );
}
