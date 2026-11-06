import 'server-only';

import { api } from '@/lib/api/api-client';

export function archiveProduct(slug: string, productId: string) {
  return api.post<void>(
    `/marketplaces/${encodeURIComponent(slug)}/products/${encodeURIComponent(productId)}/archive`,
  );
}
