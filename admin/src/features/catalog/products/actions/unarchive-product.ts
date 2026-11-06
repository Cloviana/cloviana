'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/api-client';

import { unarchiveProduct } from '../api/unarchive-product';

export async function unarchiveProductAction(
  slug: string,
  productId: string,
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    await unarchiveProduct(slug, productId);
    revalidatePath(`/mp/${slug}/products`);
    revalidatePath(`/mp/${slug}/products/${productId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError && error.details)
      return { success: false, message: error.details };
    return {
      success: false,
      message: 'Could not unarchive the product. Please try again.',
    };
  }
}
