'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/api-client';

import { updateStores } from '../api/update-stores';
import type { StoreChanges } from '../types/seller';

export async function updateStoresAction(
  slug: string,
  ids: string[],
  changes: StoreChanges,
): Promise<
  { success: true; updated: number } | { success: false; message: string }
> {
  try {
    const { updated } = await updateStores(slug, ids, changes);
    revalidatePath(`/mp/${slug}/stores`);
    return { success: true, updated };
  } catch (error) {
    if (error instanceof ApiError && error.details)
      return { success: false, message: error.details };
    return {
      success: false,
      message: 'Could not update the stores. Please try again.',
    };
  }
}
