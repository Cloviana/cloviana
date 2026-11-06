import 'server-only';

import { api } from '@/lib/api/api-client';

import type { CategoryListParams, CategoryPage } from '../types';

export function listCategories(slug: string, params: CategoryListParams = {}) {
  return api.get<CategoryPage>(
    `/marketplaces/${encodeURIComponent(slug)}/categories`,
    { params: { ...params } },
  );
}
