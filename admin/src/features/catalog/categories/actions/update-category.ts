'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/api-client';

import { updateCategory } from '../api/update-category';
import { updateCategoryRequestSchema } from '../schemas/update-category.schema';
import type { Category } from '../types';

export type UpdateCategoryResult =
  | { success: true; category: Category }
  | { success: false; message: string };

export async function updateCategoryAction(
  slug: string,
  id: string,
  input: unknown,
): Promise<UpdateCategoryResult> {
  const parsed = updateCategoryRequestSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid category.',
    };

  try {
    const category = await updateCategory(slug, id, parsed.data);
    revalidatePath(`/mp/${slug}/products/categories`);
    revalidatePath(`/mp/${slug}/products/categories/${id}`);
    return { success: true, category };
  } catch (error) {
    if (error instanceof ApiError && error.details)
      return { success: false, message: error.details };
    return {
      success: false,
      message: 'Could not save the category. Please try again.',
    };
  }
}
