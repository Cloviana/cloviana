'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/api-client';

import { deleteProducts } from '../api/delete-products';

export async function deleteProductsAction(
  slug: string,
  ids: string[],
): Promise<
  | { success: true; deleted: number; skipped: number }
  | { success: false; message: string }
> {
  try {
    const result = await deleteProducts(slug, ids);
    revalidatePath(`/mp/${slug}/products`);
    return { success: true, ...result };
  } catch (error) {
    if (error instanceof ApiError && error.details)
      return { success: false, message: error.details };
    return {
      success: false,
      message: 'Could not delete the products. Please try again.',
    };
  }
}
