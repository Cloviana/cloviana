import { randomBytes } from 'crypto';

import { NextResponse } from 'next/server';

import { env } from '@/config/env';

import { SHOPIFY_SCOPES, COOKIE_OPTIONS } from './config';

export function generateState(): string {
  return randomBytes(16).toString('hex');
}

export function buildAuthUrl(shop: string, state: string): string {
  const redirectUri = `${env.APP_URL}/api/auth/shopify/callback`;
  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_API_KEY!,
    scope: SHOPIFY_SCOPES.join(','),
    redirect_uri: redirectUri,
    state,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeCode(
  shop: string,
  code: string,
): Promise<string> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY!,
      client_secret: process.env.SHOPIFY_API_SECRET!,
      code,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Token exchange failed: ${res.status}`);
  }
  return data.access_token;
}

export function setCookieState(
  response: NextResponse,
  state: string,
  returnTo: string,
  storeId: string,
) {
  response.cookies.set('shopify_oauth_state', state, COOKIE_OPTIONS);
  response.cookies.set('shopify_oauth_return', returnTo, COOKIE_OPTIONS);
  response.cookies.set('store_id', storeId, COOKIE_OPTIONS);
}
