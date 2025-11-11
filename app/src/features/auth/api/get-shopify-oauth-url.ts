import { z } from 'zod';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export const shopifyStartSchema = z.object({
  shop: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/, {
      message: 'Enter a valid Shopify domain (e.g., cloviana2.myshopify.com)',
    })
    .transform((s) => s.trim().toLowerCase()),
  storeId: z.string(),
});

export type ShopifyStartInput = z.infer<typeof shopifyStartSchema>;

export type ShopifyStartResponse = {
  url: string;
};

export const getShopifyOauthUrl = async (
  input: ShopifyStartInput,
): Promise<string> => {
  const parsed = shopifyStartSchema.parse(input);

  const accessToken = await fetchAccessToken();
  if (!accessToken) throw new Error('Access token is not available');

  const res = await api.get<ShopifyStartResponse>(`/auth/shopify/start`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      shop: parsed.shop,
      storeId: parsed.storeId,
    },
  });

  return res.url;
};
