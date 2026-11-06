'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/api-client';

import { deleteCategory } from '../api/delete-category';

export async function deleteCategoryAction(
  slug: string,
  id: string,
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    await deleteCategory(slug, id);
    revalidatePath(`/mp/${slug}/products/categories`);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError && error.details)
      return { success: false, message: error.details };
    return {
      success: false,
      message: 'Could not delete the category. Please try again.',
    };
  }
}
