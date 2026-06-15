import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { paths } from '@/config/paths';
import { isWorkEmail } from '@/features/auth/schemas/work-email';
import { gaServerEvent } from '@/lib/ga/server';
import { createAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

function safeNextPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//')
    ? value
    : paths.business.getHref();
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const code = requestUrl.searchParams.get('code');
  const next = safeNextPath(requestUrl.searchParams.get('next'));
  const supabase = await createClient();

  const confirmation =
    tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : code
        ? await supabase.auth.exchangeCodeForSession(code)
        : { error: new Error('Confirmation token is missing') };

  if (confirmation.error) {
    return NextResponse.redirect(
      new URL(
        paths.auth.login.getHref({ error: 'confirmation_failed' }),
        requestUrl.origin,
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isWorkEmail(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        paths.auth.login.getHref({ error: 'work_email' }),
        requestUrl.origin,
      ),
    );
  }

  if (!user.user_metadata?.ga4_tracked) {
    try {
      await gaServerEvent(user.id, 'sign_up', { method: 'email' });
      const admin = createAdmin();
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, ga4_tracked: true },
      });
    } catch (error) {
      console.error('Unable to record confirmed email signup:', error);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
