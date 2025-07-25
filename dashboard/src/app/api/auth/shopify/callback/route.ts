import crypto from 'crypto';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { paths } from '@/config/paths';
import { createChannel } from '@/features/integrations/api/create-channel';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  const returnedState = searchParams.get('state');
  const hmac = searchParams.get('hmac');

  if (!shop || !code || !returnedState || !hmac)
    return new NextResponse(null, { status: 400 });

  const storedState = cookies().get('shopify_oauth_state')?.value;
  cookies().delete('shopify_oauth_state');
  if (storedState !== returnedState)
    return new NextResponse(null, { status: 401 });

  const message = Array.from(searchParams.entries())
    .filter(([k]) => k !== 'hmac' && k !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const expectedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(message)
    .digest('hex');

  if (expectedHmac !== hmac) return new NextResponse(null, { status: 401 });

  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY!,
      client_secret: process.env.SHOPIFY_API_SECRET!,
      code,
    }),
  });

  const body = await tokenRes.json();
  const accessToken = body.access_token;

  if (!tokenRes.ok || !accessToken) {
    console.error('Token exchange failed', tokenRes.status, body);
    return NextResponse.json(
      { error: 'Token exchange failed' },
      { status: 500 },
    );
  }

  const storeId = cookies().get('store_id')?.value || '';
  cookies().delete('store_id');

  await createChannel({ storeId, shop, offlineAccessToken: accessToken });

  const returnPath = cookies().get('shopify_oauth_return')?.value;
  cookies().delete('shopify_oauth_return');

  const redirectUrl = returnPath
    ? new URL(returnPath, origin)
    : new URL(paths.store.getHref(), origin);

  redirectUrl.searchParams.set('host', searchParams.get('host') || '');
  redirectUrl.searchParams.set('shop', shop);

  return NextResponse.redirect(redirectUrl);
}
