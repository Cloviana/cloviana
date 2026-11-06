'use server';

import { revalidatePath } from 'next/cache';

import { duplicateTheme } from '../api/duplicate-theme';
import { themeActionError } from '../lib/action-error';
import type { Theme, ThemeActionResult } from '../types/theme';

export async function duplicateThemeAction(
  slug: string,
  themeId: string,
): Promise<ThemeActionResult<{ theme: Theme }>> {
  try {
    const theme = await duplicateTheme(slug, themeId);
    revalidatePath(`/mp/${slug}/themes`);
    return { success: true, theme };
  } catch (error) {
    return themeActionError(
      error,
      'Could not duplicate the theme. Please try again.',
    );
  }
}
