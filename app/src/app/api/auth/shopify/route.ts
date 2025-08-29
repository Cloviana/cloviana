import { NextRequest, NextResponse } from 'next/server';

import { paths } from '@/config/paths';
import { buildShopifyAuthUrl } from '@/features/shopify/utils/build-auth-url';
import { generateShopifyOAuthState } from '@/features/shopify/utils/generate-oauth-state';
import { verifyHmac } from '@/features/shopify/utils/verify-hmac';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  if (!shop)
    return NextResponse.redirect(new URL(paths.auth.signup.getHref(), req.url));
  if (url.searchParams.has('hmac') && !verifyHmac(url.searchParams))
    return NextResponse.json({ error: 'bad_hmac' }, { status: 400 });

  const state = generateShopifyOAuthState();
  const isSecure =
    req.headers.get('x-forwarded-proto') === 'https' ||
    process.env.NODE_ENV === 'production';

  const res = NextResponse.redirect(buildShopifyAuthUrl(shop, state));
  res.cookies.set('shopify_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
  });
  res.cookies.set('shopify_shop', shop, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
  });
  return res;
}
