'use server';

import { listStores } from '../api/list-stores';
import type { StoreListParams } from '../types/seller';

export async function listStoresAction(slug: string, params: StoreListParams) {
  return listStores(slug, params);
}
