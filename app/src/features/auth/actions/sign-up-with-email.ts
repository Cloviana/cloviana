'use client';

import { createClient } from '@/lib/supabase/client';

import { checkAuthAccess } from '../api/check-auth-access';

interface AuthResponse {
  success: boolean;
  message: string;
}

const GENERIC_ERROR_MSG =
  'The email address must be a valid email address and must not be in use by another user.';
const ACCESS_DENIED_MSG = 'Your email has not been invited to a workspace.';

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

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
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
