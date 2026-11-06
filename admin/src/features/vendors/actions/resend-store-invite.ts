'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/api-client';

import { resendStoreInvite } from '../api/resend-store-invite';

export async function resendStoreInviteAction(
  slug: string,
  storeId: string,
  email: string,
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    await resendStoreInvite(slug, storeId, email);
    revalidatePath(`/mp/${slug}/stores`);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return {
        success: false,
        message: 'This store already has an admin.',
      };
    }
    if (error instanceof ApiError && error.details)
      return { success: false, message: error.details };
    return {
      success: false,
      message: 'Could not send the invitation. Please try again.',
    };
  }
}
