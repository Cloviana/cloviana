'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/api-client';

import { deleteProduct } from '../api/delete-product';

export async function deleteProductAction(
  slug: string,
  productId: string,
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    await deleteProduct(slug, productId);
    revalidatePath(`/mp/${slug}/products`);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError && error.details)
      return { success: false, message: error.details };
    return {
      success: false,
      message: 'Could not delete the product. Please try again.',
    };
  }
}
