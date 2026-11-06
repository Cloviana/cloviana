import 'server-only';

import { api } from '@/lib/api/api-client';

import type { Collection } from '../types';

export function getCollection(slug: string, id: string) {
  return api.get<Collection>(
    `/marketplaces/${encodeURIComponent(slug)}/collections/${encodeURIComponent(id)}`,
  );
}
