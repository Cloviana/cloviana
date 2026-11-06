import 'server-only';

import { api } from '@/lib/api/api-client';

import type { CategoryImpact } from '../types';

export function getCategoryImpact(slug: string, id: string) {
  return api.get<CategoryImpact>(
    `/marketplaces/${encodeURIComponent(slug)}/categories/${encodeURIComponent(id)}/impact`,
  );
}
