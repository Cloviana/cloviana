import 'server-only';

import { api } from '@/lib/api/api-client';

import type { CreateCategoryRequest } from '../schemas/create-category.schema';
import type { Category } from '../types';

export function createCategory(
  marketplaceSlug: string,
  input: CreateCategoryRequest,
) {
  return api.post<Category>(
    `/marketplaces/${encodeURIComponent(marketplaceSlug)}/categories`,
    input,
  );
}
