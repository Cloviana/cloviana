import 'server-only';

import { api } from '@/lib/api/api-client';

import type { UpdateProductRequest } from '../schemas/product.schema';
import type { ProductDetail } from '../types';

export function updateProduct(
  slug: string,
  productId: string,
  input: UpdateProductRequest,
) {
  return api.patch<ProductDetail>(
    `/marketplaces/${encodeURIComponent(slug)}/products/${encodeURIComponent(productId)}`,
    input,
  );
}
