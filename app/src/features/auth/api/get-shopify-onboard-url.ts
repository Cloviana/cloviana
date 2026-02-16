import { z } from 'zod';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export const shopifyOnboardSchema = z.object({
  shop: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/, {
      message: 'Enter a valid Shopify domain (e.g., yourstore.myshopify.com)',
    })
    .transform((s) => s.trim().toLowerCase()),
});

export type ShopifyOnboardInput = z.infer<typeof shopifyOnboardSchema>;

type ShopifyOnboardResponse = {
  url: string;
};

export const getShopifyOnboardUrl = async (
  input: ShopifyOnboardInput,
): Promise<string> => {
  const parsed = shopifyOnboardSchema.parse(input);

  const accessToken = await fetchAccessToken();
  if (!accessToken) throw new Error('Access token is not available');

  const res = await api.get<ShopifyOnboardResponse>(`/auth/shopify/onboard`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { shop: parsed.shop },
  });

  return res.url;
};
