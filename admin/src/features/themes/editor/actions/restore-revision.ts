'use server';

import { themeActionError } from '../../lib/action-error';
import type { ThemeActionResult } from '../../types/theme';
import { restoreRevision } from '../api/restore-revision';

export async function restoreRevisionAction(
  slug: string,
  themeId: string,
  revisionId: string,
  expectedRevisionId: string,
): Promise<ThemeActionResult> {
  try {
    await restoreRevision(slug, themeId, revisionId, expectedRevisionId);
    return { success: true };
  } catch (error) {
    return themeActionError(error, "Couldn't restore this version.");
  }
}
