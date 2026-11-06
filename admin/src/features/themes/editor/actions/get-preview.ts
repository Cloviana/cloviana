'use server';

import { ApiError } from '@/lib/api/api-client';

import { getPreview } from '../api/get-preview';
import type { PreviewState } from '../types';

export async function getPreviewAction(
  slug: string,
  themeId: string,
): Promise<PreviewState> {
  try {
    return await getPreview(slug, themeId);
  } catch (error) {
    // 409 means the workspace is still catching up to the current revision, which is an
    // expected state to poll through rather than a failure.
    if (error instanceof ApiError && error.status === 409) {
      return { url: null, expiresAt: null, ready: false };
    }
    throw error;
  }
}
