import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/config/env';
import { paths } from '@/config/paths';

const isSupabaseAuthCookie = (name: string) =>
  name.startsWith('sb-') &&
  (name.includes('-auth-token') || name.includes('-code-verifier'));

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL(paths.auth.login.getHref(), env.APP_URL),
  );
  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);

  request.cookies.getAll().forEach(({ name }) => {
    if (isSupabaseAuthCookie(name)) {
      response.cookies.delete(name);
    }
  });

  return response;
}
