import { z } from 'zod';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export const ShopifyConnectSchema = z.object({
  shop: z
    .string()
    .trim()
    .regex(
      /^(?!https?:\/\/)(?!-)[a-z0-9-]{1,63}(?<!-)\.myshopify\.com$/i,
      'Enter a valid Shopify domain (e.g. cloviana.myshopify.com)',
    ),
  code: z.string().trim().min(1, 'Missing code'),
  state: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{32}$/i, 'Invalid state'),
  storeId: z.string().min(1, 'storeId is required'),
});

export type ShopifyConnectData = z.infer<typeof ShopifyConnectSchema>;

export const shopifyConnect = async (input: ShopifyConnectData) => {
  const { storeId, ...payload } = ShopifyConnectSchema.parse(input);

  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is missing');

  const response = await api.post(
    `/stores/${storeId}/channels/shopify/connect`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response;
};
