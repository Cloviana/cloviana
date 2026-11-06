'use server';

import { getActiveRun } from '../api/get-active-run';

export async function getActiveRunAction(slug: string, conversationId: string) {
  return getActiveRun(slug, conversationId);
}
