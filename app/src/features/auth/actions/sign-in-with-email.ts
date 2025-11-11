'use client';

import { createClient } from '@/lib/supabase/client';

interface AuthResponse {
  success: boolean;
  message: string;
}

const GENERIC_ERROR_MSG = 'Invalid email or password.';

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
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
      message: 'Signed in successfully.',
    };
  } catch {
    return {
      success: false,
      message: GENERIC_ERROR_MSG,
    };
  }
}
