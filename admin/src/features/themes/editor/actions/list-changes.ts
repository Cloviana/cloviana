'use server';

import { ApiError } from '@/lib/api/api-client';

import { listChanges } from '../api/list-changes';

export async function listChangesAction(slug: string, themeId: string) {
  try {
    return await listChanges(slug, themeId);
  } catch (error) {
    // The workspace may still be preparing for this run: nothing has changed yet.
    if (error instanceof ApiError && error.status === 409) return [];
    throw error;
  }
}
