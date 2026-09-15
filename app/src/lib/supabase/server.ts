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
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the
          // session before rendering and passes the updated request cookies on.
        }
      },
    },
    auth: { flowType: 'pkce' },
  });
}
