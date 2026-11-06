'use server';

import { ApiError } from '@/lib/api/api-client';

import { listSourceFiles } from '../api/list-source-files';
import type { SourceFile } from '../types';

export async function listSourceFilesAction(
  slug: string,
  themeId: string,
): Promise<SourceFile[] | null> {
  try {
    return await listSourceFiles(slug, themeId);
  } catch (error) {
    // Same 409 as the preview: null tells the UI the workspace isn't ready yet.
    if (error instanceof ApiError && error.status === 409) return null;
    throw error;
  }
}
