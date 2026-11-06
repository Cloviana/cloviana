'use server';

import { getCollection } from '../api/get-collection';

export async function getCollectionAction(slug: string, id: string) {
  return getCollection(slug, id);
}
