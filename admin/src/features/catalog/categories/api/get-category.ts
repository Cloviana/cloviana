import 'server-only';

import { api } from '@/lib/api/api-client';

import type { Category } from '../types';

export function getCategory(
  slug: string,
  id: string,
  { includeHidden }: { includeHidden?: boolean } = {},
) {
  return api.get<Category>(
    `/marketplaces/${encodeURIComponent(slug)}/categories/${encodeURIComponent(id)}`,
    { params: { includeHidden: includeHidden || undefined } },
  );
}
