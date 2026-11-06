'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/api-client';

import { createProduct } from '../api/create-product';
import { createProductRequestSchema } from '../schemas/product.schema';

export type CreateProductResult =
  | { success: true; productId: string }
  | { success: false; message: string };

export async function createProductAction(
  marketplaceSlug: string,
  input: unknown,
): Promise<CreateProductResult> {
  const parsed = createProductRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid product.',
    };
  }

  try {
    const product = await createProduct(marketplaceSlug, parsed.data);
    revalidatePath(`/mp/${marketplaceSlug}/products`);
    return { success: true, productId: product.id };
  } catch (error) {
    if (error instanceof ApiError && error.details)
      return { success: false, message: error.details };
    if (error instanceof ApiError && error.status === 409) {
      return {
        success: false,
        message: 'A product with this handle already exists.',
      };
    }
    return { success: false, message: 'Could not create the product.' };
  }
}
