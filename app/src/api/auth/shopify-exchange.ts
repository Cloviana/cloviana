import { z } from 'zod';

import { api } from '@/lib/api-client';

export const ShopifyExchangeSchema = z.object({
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
});

export type ShopifyExchangeData = z.infer<typeof ShopifyExchangeSchema>;

export interface ShopifyExchangeResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
  shop_domain: string;
  shop_name: string;
}

export const shopifyExchange = async (
  input: ShopifyExchangeData,
): Promise<ShopifyExchangeResponse> => {
  const body = ShopifyExchangeSchema.parse(input);

  return api.post<ShopifyExchangeResponse>('/auth/shopify/exchange', body);
};
