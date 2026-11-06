'use server';

import { revalidatePath } from 'next/cache';

import { publishTheme } from '../api/publish-theme';
import { themeActionError } from '../lib/action-error';
import type { Theme, ThemeActionResult } from '../types/theme';

export async function publishThemeAction(
  slug: string,
  themeId: string,
): Promise<ThemeActionResult<{ theme: Theme }>> {
  try {
    const theme = await publishTheme(slug, themeId);
    revalidatePath(`/mp/${slug}/themes`);
    return { success: true, theme };
  } catch (error) {
    return themeActionError(
      error,
      'Could not publish the theme. Please try again.',
    );
  }
}
