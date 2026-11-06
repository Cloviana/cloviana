import 'server-only';

import { ApiError } from '@/lib/api/api-client';

import type { Category } from '../types';

import { getCategory } from './get-category';

// The dashboard's view of a category (inactive and internal included); null when it does not exist in this marketplace.
export async function findCategory(
  slug: string,
  id: string,
): Promise<Category | null> {
  try {
    return await getCategory(slug, id, { includeHidden: true });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
