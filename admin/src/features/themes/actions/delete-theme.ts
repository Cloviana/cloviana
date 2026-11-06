'use server';

import { revalidatePath } from 'next/cache';

import { deleteTheme } from '../api/delete-theme';
import { themeActionError } from '../lib/action-error';
import type { ThemeActionResult } from '../types/theme';

export async function deleteThemeAction(
  slug: string,
  themeId: string,
): Promise<ThemeActionResult> {
  try {
    await deleteTheme(slug, themeId);
    revalidatePath(`/mp/${slug}/themes`);
    return { success: true };
  } catch (error) {
    return themeActionError(
      error,
      'Could not delete the theme. Please try again.',
    );
  }
}
