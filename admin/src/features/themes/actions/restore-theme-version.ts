'use server';

import { revalidatePath } from 'next/cache';

import { restoreThemeVersion } from '../api/restore-theme-version';
import { themeActionError } from '../lib/action-error';
import type { Theme, ThemeActionResult } from '../types/theme';

export async function restoreThemeVersionAction(
  slug: string,
  themeId: string,
  versionId: string,
): Promise<ThemeActionResult<{ theme: Theme }>> {
  try {
    const theme = await restoreThemeVersion(slug, themeId, versionId);
    revalidatePath(`/mp/${slug}/themes`);
    return { success: true, theme };
  } catch (error) {
    return themeActionError(
      error,
      'Could not restore the version. Please try again.',
    );
  }
}
