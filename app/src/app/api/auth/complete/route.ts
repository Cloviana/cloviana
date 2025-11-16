import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/config/env';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const ticket = req.nextUrl.searchParams.get('ticket');
  if (!ticket) {
    // No ticket — bounce to login or a safe page
    return NextResponse.redirect(
      new URL('/login?e=missing_ticket', env.APP_URL),
    );
  }

  // Exchange the one-time ticket for Supabase tokens + target store
  const apiUrl = env.API_URL; // e.g. https://api.example.com
  const r = await fetch(`${apiUrl}/auth/shopify/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Important: never cache this; it's a one-time exchange
    cache: 'no-store',
    body: JSON.stringify({ ticket }),
  });

  if (!r.ok) {
    return NextResponse.redirect(
      new URL('/login?e=ticket_invalid', env.APP_URL),
    );
  }

  const { access_token, refresh_token, store_id } = await r.json();

  // Set the Supabase session on your app domain (HttpOnly cookies)
  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) {
    return NextResponse.redirect(
      new URL('/login?e=session_set_failed', env.APP_URL),
    );
  }

  // Success — route the user to the store dashboard
  return NextResponse.redirect(new URL(`/${store_id}/blogs`, env.APP_URL));
}
