import 'server-only';

import { api } from '@/lib/api/api-client';

import type { StoreListParams, StorePage } from '../types/seller';

// The API searches from 2 characters and pages by offset.
export function listStores(slug: string, params: StoreListParams) {
  const search = params.q?.trim();
  return api.get<StorePage>(
    `/marketplaces/${encodeURIComponent(slug)}/sellers`,
    {
      params: {
        search: search && search.length >= 2 ? search : undefined,
        status: params.status ?? 'ALL',
        limit: params.pageSize,
        offset: (params.page - 1) * params.pageSize,
      },
    },
  );
}
