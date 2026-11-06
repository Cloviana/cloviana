'use server';

import { themeActionError } from '../../lib/action-error';
import type { ThemeActionResult } from '../../types/theme';
import { requestWorkspace } from '../api/request-workspace';

export async function requestWorkspaceAction(
  slug: string,
  themeId: string,
): Promise<ThemeActionResult> {
  try {
    await requestWorkspace(slug, themeId);
    return { success: true };
  } catch (error) {
    return themeActionError(error, "Couldn't start the preview.");
  }
}
