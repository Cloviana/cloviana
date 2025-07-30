import { NextRequest, NextResponse } from 'next/server';

import {
  generateState,
  buildAuthUrl,
  setCookieState,
} from '@/lib/shopify/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const shop = searchParams.get('shop');
  if (!shop) return NextResponse.json({ ok: true });
  const returnTo = searchParams.get('returnTo') ?? '/';
  const storeId = searchParams.get('storeId') ?? '';
  const state = generateState();
  const authUrl = buildAuthUrl(shop, state);
  const response = NextResponse.redirect(authUrl);
  setCookieState(response, state, returnTo, storeId);
  return response;
}
