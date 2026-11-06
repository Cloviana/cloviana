'use server';

import { getCategoryImpact } from '../api/get-category-impact';

export async function getCategoryImpactAction(slug: string, id: string) {
  return getCategoryImpact(slug, id);
}
