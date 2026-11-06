'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/api-client';

import { updateProduct } from '../api/update-product';
import { updateProductRequestSchema } from '../schemas/product.schema';
import type { ProductDetail } from '../types';

type UpdateProductResult =
  | { success: true; product: ProductDetail }
  | { success: false; message: string };

export async function updateProductAction(
  slug: string,
  productId: string,
  input: unknown,
): Promise<UpdateProductResult> {
  const parsed = updateProductRequestSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid product.',
    };
  try {
    const product = await updateProduct(slug, productId, parsed.data);
    revalidatePath(`/mp/${slug}/products`);
    revalidatePath(`/mp/${slug}/products/${productId}`);
    return { success: true, product };
  } catch (error) {
    if (error instanceof ApiError && error.details)
      return { success: false, message: error.details };
    return {
      success: false,
      message: 'Could not save the product. Please try again.',
    };
  }
}
