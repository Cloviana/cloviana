import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import {
  createChannelSchema,
  createChannel,
} from '@/api/channel/create-channel';
import { createStore, createStoreSchema } from '@/api/stores/create-store';
import { getStore } from '@/api/stores/get-store';
import { getStores } from '@/api/stores/get-stores';
import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { shopifySignIn } from '@/features/auth/actions/shopify-sign-in';
import { exchangeCode } from '@/features/shopify/actions/exchange-code';
import { verifyHmac } from '@/features/shopify/utils/verify-hmac';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const stateCookie = cookies().get('shopify_state')?.value;
  const stateParam = searchParams.get('state');
  if (stateCookie !== stateParam)
    return NextResponse.json(null, { status: 401 });
  if (!verifyHmac(searchParams))
    return NextResponse.json(null, { status: 401 });

  const shop = searchParams.get('shop')!;
  const code = searchParams.get('code')!;

  const offlineAccessToken = await exchangeCode(shop, code);
  await shopifySignIn(shop);

  const stores = await getStores();
  const store =
    stores[0] ??
    (await createStore(
      createStoreSchema.parse({ name: 'My Personal Store', domainUrl: shop }),
    ));
  const storeDetail = await getStore(store.id);

  if (!storeDetail.channel) {
    await createChannel(
      createChannelSchema.parse({
        storeId: store.id,
        shop,
        offlineAccessToken,
      }),
    );
  }

  const returnPath =
    cookies().get('shopify_return_to')?.value ?? paths.store.getHref(store.id);

  const res = NextResponse.redirect(new URL(returnPath, env.APP_URL));
  res.cookies.delete('shopify_state');
  res.cookies.delete('shopify_return_to');
  return res;
}
