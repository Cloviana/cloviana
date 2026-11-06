'use server';

import { themeActionError } from '../../lib/action-error';
import type { ThemeActionResult } from '../../types/theme';
import { restartWorkspace } from '../api/restart-workspace';

export async function restartWorkspaceAction(
  slug: string,
  themeId: string,
): Promise<ThemeActionResult> {
  try {
    await restartWorkspace(slug, themeId);
    return { success: true };
  } catch (error) {
    return themeActionError(error, "Couldn't restart the preview.");
  }
}
