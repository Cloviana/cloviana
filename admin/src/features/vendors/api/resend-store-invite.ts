import 'server-only';

import { api } from '@/lib/api/api-client';

import type { StoreListItem } from '../types/seller';

export function resendStoreInvite(
  slug: string,
  storeId: string,
  email: string,
) {
  return api.post<StoreListItem>(
    `/marketplaces/${encodeURIComponent(slug)}/sellers/${encodeURIComponent(storeId)}/invites`,
    { email },
  );
}
