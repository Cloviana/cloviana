import 'server-only';

import { api } from '@/lib/api/api-client';

import type { SellerListParams, SellerPage } from '../types/seller';

export function listSellers(slug: string, params: SellerListParams = {}) {
  return api.get<SellerPage>(
    `/marketplaces/${encodeURIComponent(slug)}/sellers`,
    { params: { ...params } },
  );
}
