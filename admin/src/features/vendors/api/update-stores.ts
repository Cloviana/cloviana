import 'server-only';

import { api } from '@/lib/api/api-client';

import type { StoreChanges } from '../types/seller';

export function updateStores(
  slug: string,
  ids: string[],
  changes: StoreChanges,
) {
  return api.patch<{ updated: number }>(
    `/marketplaces/${encodeURIComponent(slug)}/sellers`,
    { ids, ...changes },
  );
}
