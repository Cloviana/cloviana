import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { shopifyExchange } from '@/api/auth/shopify-exchange';
import { shopifyConnect } from '@/api/channels/shopify-connect';
import { getStores } from '@/api/stores/get-stores';
import { env } from '@/config/env';
import { verifyHmac } from '@/features/shopify/utils/verify-hmac';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const store = await cookies();
  const stateCookie = store.get('shopify_state')?.value;
  const stateParam = searchParams.get('state');
  if (stateCookie !== stateParam)
    return NextResponse.json(null, { status: 401 });
  if (!verifyHmac(searchParams))
    return NextResponse.json(null, { status: 401 });

  const shop = searchParams.get('shop')!;
  const code = searchParams.get('code')!;
  const state = stateParam!;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const stores = await getStores();
    const current = stores[0];
    await shopifyConnect({ shop, code, state, storeId: current.id });
  } else {
    const { access_token, refresh_token } = await shopifyExchange({
      shop,
      code,
      state,
    });
    await supabase.auth.setSession({ access_token, refresh_token });
  }

  const returnPath = store.get('shopify_return_to')?.value ?? '/';
  const res = NextResponse.redirect(new URL(returnPath, env.APP_URL));
  res.cookies.delete('shopify_state');
  res.cookies.delete('shopify_return_to');
  return res;
}
