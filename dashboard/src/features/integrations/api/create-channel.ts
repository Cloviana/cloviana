import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { Channel } from '@/types/api';

export type CreateStoreData = {
  shop: string;
  offlineAccessToken: string;
  storeId: string;
};

export const createChannel = async ({
  storeId,
  ...payload
}: CreateStoreData): Promise<Channel> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }

  const response = await api.post<Channel>(
    `/stores/${storeId}/channels`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response;
};
