import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { env } from '@/config/env';

export async function createClient() {
  const store = await cookies();
  return createServerClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet: any[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          store.set(name, value, options),
        );
      },
    },
    auth: { flowType: 'pkce' },
  });
}
