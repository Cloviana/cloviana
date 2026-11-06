'use server';

import { listCategories } from '../api/list-categories';
import type { CategoryListParams } from '../types';

export async function listCategoriesAction(
  slug: string,
  params: CategoryListParams = {},
) {
  return listCategories(slug, params);
}
