'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/api-client';

import { createCategory } from '../api/create-category';
import { createCategoryRequestSchema } from '../schemas/create-category.schema';
import type { Category } from '../types';

export type CreateCategoryResult =
  | { success: true; category: Category }
  | { success: false; message: string };

export async function createCategoryAction(
  marketplaceSlug: string,
  input: unknown,
): Promise<CreateCategoryResult> {
  const parsed = createCategoryRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid category.',
    };
  }

  try {
    const category = await createCategory(marketplaceSlug, parsed.data);
    revalidatePath(`/mp/${marketplaceSlug}/products/categories`);
    return { success: true, category };
  } catch (error) {
    if (error instanceof ApiError && error.details)
      return { success: false, message: error.details };
    if (error instanceof ApiError && error.status === 409) {
      return {
        success: false,
        message: 'A category with this handle already exists.',
      };
    }
    return { success: false, message: 'Could not create the category.' };
  }
}
