'use server';

import { getCategory } from '../api/get-category';

export async function getCategoryAction(
  slug: string,
  id: string,
  options: { includeHidden?: boolean } = {},
) {
  return getCategory(slug, id, options);
}
