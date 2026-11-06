'use server';

import { themeActionError } from '../../lib/action-error';
import type { ThemeActionResult } from '../../types/theme';
import { cancelRun } from '../api/cancel-run';

export async function cancelRunAction(
  slug: string,
  runId: string,
): Promise<ThemeActionResult> {
  try {
    await cancelRun(slug, runId);
    return { success: true };
  } catch (error) {
    return themeActionError(error, "Couldn't stop the agent.");
  }
}
