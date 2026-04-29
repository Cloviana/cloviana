import { NextResponse } from 'next/server';

import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { checkAuthAccess } from '@/features/auth/api/check-auth-access';
import { gaServerEvent } from '@/lib/ga/server';
import { createAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  try {
    if (!code) throw new Error('Code is missing');

    const supabase = await createClient();
    const { data: session, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error || !session) {
      throw new Error('Failed to exchange code for session');
    }

    const email = session.user.email?.trim().toLowerCase();
    if (!email) {
      throw new Error('Authenticated user email is missing');
    }

    const access = await checkAuthAccess(email);
    if (!access.allowed) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL(`${paths.auth.login.getHref()}?error=invite_only`, env.APP_URL),
      );
    }

    const uid = session.user.id;

    if (!session.user.user_metadata?.ga4_tracked) {
      const admin = createAdmin();
      await gaServerEvent(uid, 'sign_up', { method: 'google' });
      await admin.auth.admin.updateUserById(uid, {
        user_metadata: { ...session.user.user_metadata, ga4_tracked: true },
      });
    }

    return NextResponse.redirect(
      new URL(paths.business.getHref(), env.APP_URL),
    );
  } catch (err) {
    console.error('Supabase auth callback error:', err);
    return NextResponse.redirect(
      new URL(paths.auth.login.getHref(), env.APP_URL),
    );
  }
}
