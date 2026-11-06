'use server';

import { getTheme } from '../api/get-theme';

export async function getThemeAction(slug: string, themeId: string) {
  return getTheme(slug, themeId);
}
