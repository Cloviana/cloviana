import 'server-only';

import { api } from '@/lib/api/api-client';

export function deleteProducts(slug: string, ids: string[]) {
  return api.post<{ deleted: number; skipped: number }>(
    `/marketplaces/${encodeURIComponent(slug)}/products/delete`,
    { ids },
  );
}
