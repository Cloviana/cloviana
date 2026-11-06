import 'server-only';

import { api } from '@/lib/api/api-client';

import type { CreateStoreRequest } from '../schemas/create-store.schema';
import type { StoreListItem } from '../types/seller';

export function createStore(slug: string, input: CreateStoreRequest) {
  return api.post<StoreListItem>(
    `/marketplaces/${encodeURIComponent(slug)}/sellers`,
    input,
  );
}
