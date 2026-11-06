'use server';

import { saveThemeVersion } from '../api/save-theme-version';
import { themeActionError } from '../lib/action-error';
import { createThemeVersionRequestSchema } from '../schemas/theme.schema';
import type { ThemeActionResult, ThemeVersion } from '../types/theme';

export async function saveThemeVersionAction(
  slug: string,
  themeId: string,
  input: unknown,
): Promise<ThemeActionResult<{ version: ThemeVersion }>> {
  const parsed = createThemeVersionRequestSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid label.',
    };

  try {
    const version = await saveThemeVersion(slug, themeId, parsed.data);
    return { success: true, version };
  } catch (error) {
    return themeActionError(
      error,
      'Could not save the version. Please try again.',
    );
  }
}
