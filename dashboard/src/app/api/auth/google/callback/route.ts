import { NextResponse } from 'next/server';

import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();

  try {
    const code = searchParams.get('code');
    const next = paths.store.getHref();

    if (code) {
      const { error, data } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data) {
        console.error('Supabase auth error:', error);
        throw new Error('Failed to exchange code for session.');
      }

      return NextResponse.redirect(new URL(next, env.APP_URL));
    }

    return NextResponse.redirect(
      new URL(paths.auth.login.getHref(), env.APP_URL),
    );
  } catch (error) {
    await supabase.auth.signOut();
    console.error('Error during authentication:', error);
    return NextResponse.redirect(
      new URL(paths.auth.login.getHref(), env.APP_URL),
    );
  }
}
