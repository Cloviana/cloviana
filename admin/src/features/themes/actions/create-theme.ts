'use server';

import { revalidatePath } from 'next/cache';

import { createTheme } from '../api/create-theme';
import { themeActionError } from '../lib/action-error';
import { createThemeRequestSchema } from '../schemas/theme.schema';
import type { Theme, ThemeActionResult } from '../types/theme';

export async function createThemeAction(
  slug: string,
  input: unknown,
): Promise<ThemeActionResult<{ theme: Theme }>> {
  const parsed = createThemeRequestSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid theme.',
    };

  try {
    const theme = await createTheme(slug, parsed.data);
    revalidatePath(`/mp/${slug}/themes`);
    return { success: true, theme };
  } catch (error) {
    return themeActionError(
      error,
      'Could not create the theme. Please try again.',
    );
  }
}
