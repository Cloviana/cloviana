import { NextResponse } from 'next/server';

import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { handleCallback } from '@/lib/supabase/callback';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  try {
    if (!code) throw new Error('Code is missing');

    await handleCallback(code);
    return NextResponse.redirect(new URL(paths.store.getHref(), env.APP_URL));
  } catch (err) {
    console.error('Supabase auth callback error:', err);
    return NextResponse.redirect(
      new URL(paths.auth.login.getHref(), env.APP_URL),
    );
  }
}
