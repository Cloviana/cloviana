'use server';

import { themeActionError } from '../../lib/action-error';
import type { ThemeActionResult } from '../../types/theme';
import { undoRevision } from '../api/undo-revision';

export async function undoRevisionAction(
  slug: string,
  themeId: string,
  expectedRevisionId: string,
): Promise<ThemeActionResult> {
  try {
    await undoRevision(slug, themeId, expectedRevisionId);
    return { success: true };
  } catch (error) {
    return themeActionError(error, "Couldn't undo.");
  }
}
