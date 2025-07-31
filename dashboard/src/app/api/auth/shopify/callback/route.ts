import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { createChannel } from '@/features/integrations/api/create-channel';
import { exchangeCode } from '@/lib/shopify/auth';
import { verifyCallbackHmac } from '@/lib/shopify/verify';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const required = ['shop', 'code', 'state', 'hmac'];
  for (const p of required) {
    if (!searchParams.get(p)) return NextResponse.json(null, { status: 400 });
  }

  const cookieStore = cookies();
  const storedState = cookieStore.get('shopify_oauth_state')?.value;
  cookieStore.delete('shopify_oauth_state');
  if (storedState !== searchParams.get('state')) {
    return NextResponse.json(null, { status: 401 });
  }
  if (!verifyCallbackHmac(searchParams)) {
    return NextResponse.json(null, { status: 401 });
  }

  let token: string;
  try {
    token = await exchangeCode(
      searchParams.get('shop')!,
      searchParams.get('code')!,
    );
  } catch {
    return NextResponse.json(
      { error: 'Token exchange failed' },
      { status: 500 },
    );
  }

  const storeId = cookieStore.get('store_id')?.value || '';
  cookieStore.delete('store_id');
  try {
    await createChannel({
      storeId,
      shop: searchParams.get('shop')!,
      offlineAccessToken: token,
    });
  } catch (err) {
    console.error('⚠️ createChannel failed:', err);
  }

  const returnPath = cookieStore.get('shopify_oauth_return')?.value;
  cookieStore.delete('shopify_oauth_return');
  const redirectUrl = returnPath
    ? new URL(returnPath, env.APP_URL)
    : new URL(paths.store.getHref(), env.APP_URL);
  redirectUrl.searchParams.set('host', searchParams.get('host') ?? '');
  redirectUrl.searchParams.set('shop', searchParams.get('shop')!);

  return NextResponse.redirect(redirectUrl);
}
