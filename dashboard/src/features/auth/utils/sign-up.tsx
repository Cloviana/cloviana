'use client';

import { createClient } from '@/lib/supabase/client';

interface SignUpResponse {
  success: boolean;
  message: string;
}

const ALREADY_REGISTERED_MSG =
  'This account already exists. Enter a different email, or sign in to continue.';
const GENERIC_ERROR_MSG = 'Something went wrong, please try again later.';

export const signUp = async (
  email: string,
  password: string,
  metadata?: Record<string, any>,
): Promise<SignUpResponse> => {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      const registered = error.message.includes('User already registered');
      return {
        success: false,
        message: registered ? ALREADY_REGISTERED_MSG : GENERIC_ERROR_MSG,
      };
    }

    return {
      success: true,
      message: 'Sign-up successful!',
    };
  } catch {
    return { success: false, message: GENERIC_ERROR_MSG };
  }
};
