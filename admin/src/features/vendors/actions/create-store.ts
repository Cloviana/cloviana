'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/api-client';

import { createStore } from '../api/create-store';
import { createStoreRequestSchema } from '../schemas/create-store.schema';
import type { StoreListItem } from '../types/seller';

export type CreateStoreResult =
  | { success: true; store: StoreListItem }
  | { success: false; message: string; field?: 'handle' };

export async function createStoreAction(
  slug: string,
  input: unknown,
): Promise<CreateStoreResult> {
  const parsed = createStoreRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid store.',
    };
  }

  try {
    const store = await createStore(slug, parsed.data);
    revalidatePath(`/mp/${slug}/stores`);
    return { success: true, store };
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return {
        success: false,
        message: 'This handle is taken. Try another one.',
        field: 'handle',
      };
    }
    if (error instanceof ApiError && error.details)
      return { success: false, message: error.details };
    return {
      success: false,
      message: 'Could not add the store. Try again.',
    };
  }
}
