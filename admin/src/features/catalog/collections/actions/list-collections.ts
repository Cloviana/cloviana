'use server';

import { listCollections } from '../api/list-collections';
import type { CollectionListParams } from '../types';

export async function listCollectionsAction(
  slug: string,
  params: CollectionListParams = {},
) {
  return listCollections(slug, params);
}
