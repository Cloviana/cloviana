'use server';

import { listThemes } from '../api/list-themes';

export async function listThemesAction(slug: string) {
  return listThemes(slug);
}
