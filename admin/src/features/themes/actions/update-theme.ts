'use server';

import { revalidatePath } from 'next/cache';

import { updateTheme } from '../api/update-theme';
import { themeActionError } from '../lib/action-error';
import { updateThemeRequestSchema } from '../schemas/theme.schema';
import type { Theme, ThemeActionResult } from '../types/theme';

export async function updateThemeAction(
  slug: string,
  themeId: string,
  input: unknown,
): Promise<ThemeActionResult<{ theme: Theme }>> {
  const parsed = updateThemeRequestSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid theme.',
    };

  try {
    const theme = await updateTheme(slug, themeId, parsed.data);
    revalidatePath(`/mp/${slug}/themes`);
    return { success: true, theme };
  } catch (error) {
    return themeActionError(
      error,
      'Could not save the theme. Please try again.',
    );
  }
}
