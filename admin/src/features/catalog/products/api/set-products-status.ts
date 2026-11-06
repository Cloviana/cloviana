import 'server-only';

import { api } from '@/lib/api/api-client';

import type { BulkProductStatus } from '../types';

export function setProductsStatus(
  slug: string,
  ids: string[],
  status: BulkProductStatus,
) {
  return api.post<{ updated: number }>(
    `/marketplaces/${encodeURIComponent(slug)}/products/status`,
    { ids, status },
  );
}
