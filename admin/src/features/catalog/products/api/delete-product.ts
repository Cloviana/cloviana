import 'server-only';

import { api } from '@/lib/api/api-client';

export function deleteProduct(slug: string, productId: string) {
  return api.delete<void>(
    `/marketplaces/${encodeURIComponent(slug)}/products/${encodeURIComponent(productId)}`,
  );
}
