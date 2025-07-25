import { randomBytes } from 'crypto';

import { NextResponse } from 'next/server';

import { env } from '@/config/env';

const SCOPES = [
  'read_products',
  'write_products',
  'read_content',
  'write_content',
  'read_themes',
  'write_themes',
  'read_metaobjects',
  'write_metaobjects',
  'read_online_store_navigation',
  'write_online_store_navigation',
  'read_script_tags',
  'write_script_tags',
  'read_locales',
];

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 600,
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  const returnTo = url.searchParams.get('returnTo') || '/';
  const storeId = url.searchParams.get('storeId') || '';

  if (!shop) return NextResponse.json({ ok: true });

  const state = randomBytes(16).toString('hex');
  const redirectUri = `${env.APP_URL}/api/auth/shopify/callback`;
  const authUrl =
    `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}` +
    `&scope=${encodeURIComponent(SCOPES.join(','))}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;
  const res = NextResponse.redirect(authUrl);
  res.cookies.set('shopify_oauth_state', state, COOKIE_OPTIONS);
  res.cookies.set('shopify_oauth_return', returnTo, COOKIE_OPTIONS);
  res.cookies.set('store_id', storeId, COOKIE_OPTIONS);
  return res;
}
