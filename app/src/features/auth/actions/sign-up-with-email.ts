'use client';

import { createClient } from '@/lib/supabase/client';

import { checkAuthAccess } from '../api/check-auth-access';

type AuthResponse =
  | { success: true }
  | {
      success: false;
      message: string;
    };

const GENERIC_ERROR_MSG =
  'The email address must be a valid email address and must not be in use by another user.';
const ACCESS_DENIED_MSG =
  'Use your work email. Personal email providers are not accepted.';

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const supabase = createClient();
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const access = await checkAuthAccess(normalizedEmail);
    if (!access.allowed) {
      return {
        success: false,
        message: ACCESS_DENIED_MSG,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return {
        success: false,
        message: error.message || GENERIC_ERROR_MSG,
      };
    }

    if (!data.session) {
      return {
        success: false,
        message: 'A session could not be started. Please try signing in.',
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
