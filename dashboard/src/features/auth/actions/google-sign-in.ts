'use client';

import { env } from '@/config/env';
import { createClient } from '@/lib/supabase/client';

export const googleSignIn = async () => {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${env.APP_URL}/api/auth/google/callback`,
    },
  });
};
