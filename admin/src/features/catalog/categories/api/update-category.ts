import 'server-only';

import { api } from '@/lib/api/api-client';

import type { UpdateCategoryRequest } from '../schemas/update-category.schema';
import type { Category } from '../types';

export function updateCategory(
  slug: string,
  id: string,
  input: UpdateCategoryRequest,
) {
  return api.patch<Category>(
    `/marketplaces/${encodeURIComponent(slug)}/categories/${encodeURIComponent(id)}`,
    input,
  );
}
