'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/api-client';

import { setProductsStatus } from '../api/set-products-status';
import type { BulkProductStatus } from '../types';

export async function setProductsStatusAction(
  slug: string,
  ids: string[],
  status: BulkProductStatus,
): Promise<
  { success: true; updated: number } | { success: false; message: string }
> {
  try {
    const { updated } = await setProductsStatus(slug, ids, status);
    revalidatePath(`/mp/${slug}/products`);
    return { success: true, updated };
  } catch (error) {
    if (error instanceof ApiError && error.details)
      return { success: false, message: error.details };
    return {
      success: false,
      message: 'Could not update the products. Please try again.',
    };
  }
}
