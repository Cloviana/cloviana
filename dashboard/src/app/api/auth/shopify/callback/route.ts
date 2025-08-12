import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import {
  createChannelSchema,
  createChannel,
} from '@/api/channel/create-channel';
import { createStore, createStoreSchema } from '@/api/stores/create-store';
import { getStores } from '@/api/stores/get-stores';
import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { shopifySignIn } from '@/features/auth/actions/shopify-sign-in';
import { exchangeCode } from '@/features/shopify/actions/exchange-code';
import { verifyHmac } from '@/features/shopify/utils/verify-hmac';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cookiesJar = cookies();

  if (cookiesJar.get('shopify_state')?.value !== searchParams.get('state'))
    return NextResponse.json(null, { status: 401 });
  cookiesJar.delete('shopify_state');
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
      createStoreSchema.parse({
        name: 'My Personal Store',
        domainUrl: shop,
      }),
    ));

  await createChannel(
    createChannelSchema.parse({
      storeId: store.id,
      shop,
      offlineAccessToken,
    }),
  );

  const returnPath =
    cookiesJar.get('shopify_return_to')?.value ?? paths.store.getHref(store.id);
  cookiesJar.delete('shopify_return_to');

  return NextResponse.redirect(new URL(returnPath, env.APP_URL));
}
