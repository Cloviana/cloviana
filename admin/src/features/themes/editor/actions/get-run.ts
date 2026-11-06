'use server';

import { getRun } from '../api/get-run';

export async function getRunAction(slug: string, runId: string) {
  return getRun(slug, runId);
}
