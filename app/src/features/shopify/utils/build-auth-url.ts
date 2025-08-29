import { env } from '@/config/env';

import { SCOPES } from '../constants/scopes';

export function buildShopifyAuthUrl(shop: string, state: string): string {
  const redirectUri = `${env.APP_URL}/api/auth/shopify/callback`;
  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_API_KEY!,
    scope: SCOPES.join(','),
    redirect_uri: redirectUri,
    state,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}
