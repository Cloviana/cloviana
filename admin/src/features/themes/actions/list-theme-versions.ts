'use server';

import { listThemeVersions } from '../api/list-theme-versions';

export async function listThemeVersionsAction(slug: string, themeId: string) {
  return listThemeVersions(slug, themeId);
}
