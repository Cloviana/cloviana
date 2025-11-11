'use client';

import { createClient } from '@/lib/supabase/client';

interface AuthResponse {
  success: boolean;
  message: string;
}

const GENERIC_ERROR_MSG = 'Something went wrong, please try again later.';

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
      if (
        error.message.toLowerCase().includes('already') ||
        error.message.toLowerCase().includes('registered')
      ) {
        return {
          success: false,
          message: 'An account already exists with this email.',
        };
      }

      if (error.message.toLowerCase().includes('invalid')) {
        return {
          success: false,
          message: 'Please provide a valid email address.',
        };
      }

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
