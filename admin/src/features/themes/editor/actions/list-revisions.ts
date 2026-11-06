'use server';

import { listRevisions } from '../api/list-revisions';

export async function listRevisionsAction(slug: string, themeId: string) {
  return listRevisions(slug, themeId);
}
