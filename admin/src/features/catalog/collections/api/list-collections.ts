import 'server-only';

import { api } from '@/lib/api/api-client';

import type { CollectionListParams, CollectionPage } from '../types';

export function listCollections(
  slug: string,
  params: CollectionListParams = {},
) {
  return api.get<CollectionPage>(
    `/marketplaces/${encodeURIComponent(slug)}/collections`,
    { params: { ...params } },
  );
}
