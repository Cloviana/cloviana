'use client';

import { createClient } from '@/lib/supabase/client';

interface AuthResponse {
  success: boolean;
  message: string;
}

const GENERIC_ERROR_MSG =
  'The email address must be a valid email address and must not be in use by another user.';

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        message: GENERIC_ERROR_MSG,
      };
    }

    return {
      success: true,
      message: 'Account created. Check your inbox to confirm your email.',
    };
  } catch {
    return {
      success: false,
      message: GENERIC_ERROR_MSG,
    };
  }
}
