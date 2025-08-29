'use client';

import { createClient } from '@/lib/supabase/client';

interface SignOutResponse {
  success: boolean;
  message: string;
}

const GENERIC_ERROR_MSG = 'Something went wrong, please try again later.';

export const signOut = async (): Promise<SignOutResponse> => {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        message: GENERIC_ERROR_MSG,
      };
    }

    return { success: true, message: 'Signed out successfully.' };
  } catch {
    return {
      success: false,
      message: GENERIC_ERROR_MSG,
    };
  }
};
