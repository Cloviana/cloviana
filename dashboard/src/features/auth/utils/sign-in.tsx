'use client';

import { createClient } from '@/lib/supabase/client';

interface AuthResponse {
  success: boolean;
  message: string;
}

const INVALID_CREDENTIALS_MSG =
  'This account does not exist or password is incorrect.';
const GENERIC_ERROR_MSG = 'Something went wrong, please try again later.';

export const signIn = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const invalid = error.message
        .toLowerCase()
        .includes('invalid login credentials');
      return {
        success: false,
        message: invalid ? INVALID_CREDENTIALS_MSG : GENERIC_ERROR_MSG,
      };
    }

    return { success: true, message: 'Sign-in successful.' };
  } catch {
    return { success: false, message: GENERIC_ERROR_MSG };
  }
};
