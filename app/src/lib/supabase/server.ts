import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { env } from '@/config/env';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Intentionally ignore: setAll was called in a Server Component
        }
      },
    },
    auth: { flowType: 'pkce' },
  });
}
