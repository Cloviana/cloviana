'use client';

import { platformAuth } from '@/lib/platform-auth/client';

interface AuthResponse {
  success: boolean;
  message: string;
}

const GENERIC_ERROR_MSG = 'Invalid email or password.';

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const { error } = await platformAuth.signIn.email({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return {
        success: false,
        message: error.message || GENERIC_ERROR_MSG,
      };
    }

    return {
      success: true,
      message: 'Signed in successfully.',
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : GENERIC_ERROR_MSG,
    };
  }
}
