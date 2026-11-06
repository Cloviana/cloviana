'use server';

import { themeActionError } from '../../lib/action-error';
import type { ThemeActionResult } from '../../types/theme';
import { redoRevision } from '../api/redo-revision';

export async function redoRevisionAction(
  slug: string,
  themeId: string,
  expectedRevisionId: string,
): Promise<ThemeActionResult> {
  try {
    await redoRevision(slug, themeId, expectedRevisionId);
    return { success: true };
  } catch (error) {
    return themeActionError(error, "Couldn't redo.");
  }
}
