'use client';

import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { createClient } from '@/lib/supabase/client';

import { checkAuthAccess } from '../api/check-auth-access';

interface AuthResponse {
  success: boolean;
  message: string;
  needsVerification?: boolean;
}

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
      options: {
        emailRedirectTo: `${env.APP_URL}/api/auth/confirm?next=${encodeURIComponent(paths.business.getHref())}`,
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message || GENERIC_ERROR_MSG,
      };
    }

    if (data.session) {
      return {
        success: true,
        message: 'Account created. Continue setup.',
        needsVerification: false,
      };
    }

    return {
      success: true,
      message: 'Check your work inbox to confirm your email.',
      needsVerification: true,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : GENERIC_ERROR_MSG,
    };
  }
}
