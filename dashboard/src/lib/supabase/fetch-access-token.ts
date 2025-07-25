import { createBrowserClient, createServerClient } from '@supabase/ssr';

import { env } from '@/config/env';

const getSupabase = async () => {
  if (typeof window !== 'undefined') {
    return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }

  const { cookies } = await import('next/headers');
  const store = cookies();

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: () => {},
    },
  });
};

export const fetchAccessToken = async () => {
  const supabase = await getSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};
