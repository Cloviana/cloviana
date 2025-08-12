'use server';

import { cookies } from 'next/headers';

import { buildShopifyAuthUrl } from '@/features/shopify/utils/build-auth-url';
import { generateShopifyOAuthState } from '@/features/shopify/utils/generate-oauth-state';

export async function startShopifyInstall(shop: string, returnTo: string) {
  const state = generateShopifyOAuthState();
  cookies().set('shopify_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
  });
  cookies().set('shopify_return_to', returnTo, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
  });
  cookies().set('shopify_shop', shop, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
  });
  return buildShopifyAuthUrl(shop, state);
}
