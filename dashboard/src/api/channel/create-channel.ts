import { z } from 'zod';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { Channel } from '@/types/api';

export const createChannelSchema = z.object({
  shop: z
    .string()
    .trim()
    .regex(
      /^(?!https?:\/\/)[a-z0-9-]+\.myshopify\.com$/i,
      'Enter a valid Shopify domain without protocol',
    ),
  offlineAccessToken: z.string().min(1, 'offlineAccessToken is required'),
  storeId: z.string().min(1, 'storeId is required'),
});

export type CreateStoreData = z.infer<typeof createChannelSchema>;

export const createChannel = async (
  input: CreateStoreData,
): Promise<Channel> => {
  const { storeId, ...payload } = createChannelSchema.parse(input);

  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is missing');

  const response = await api.post<Channel>(
    `/stores/${storeId}/channels`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response;
};
