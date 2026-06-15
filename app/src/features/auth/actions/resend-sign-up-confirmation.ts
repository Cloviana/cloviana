'use client';

import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { isWorkEmail } from '@/features/auth/schemas/work-email';
import { createClient } from '@/lib/supabase/client';

export async function resendSignUpConfirmation(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isWorkEmail(normalizedEmail)) {
    throw new Error('Enter the work email used to create the account.');
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizedEmail,
    options: {
      emailRedirectTo: `${env.APP_URL}/api/auth/confirm?next=${encodeURIComponent(paths.business.getHref())}`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}
