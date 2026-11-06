'use client';

import { platformAuth } from '@/lib/platform-auth/client';

type AuthResponse =
  | { success: true }
  | {
      success: false;
      message: string;
    };

const GENERIC_ERROR_MSG =
  'The email address must be a valid email address and must not be in use by another user.';

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const { error } = await platformAuth.signUp.email({
      email: normalizedEmail,
      password,
      name: normalizedEmail.split('@')[0],
    });

    if (error) {
      return {
        success: false,
        message: error.message || GENERIC_ERROR_MSG,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : GENERIC_ERROR_MSG,
    };
  }
}
