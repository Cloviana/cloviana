import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { CheckoutSession } from '@/types/api';

export type CreateTrialCheckoutSessionData = {
  priceId: string;
  storeId: string;
};

export const createTrialCheckoutSession = async ({
  storeId,
  ...payload
}: CreateTrialCheckoutSessionData): Promise<CheckoutSession> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }

  const response = await api.post<CheckoutSession>(
    `/stores/${storeId}/billing/trials`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response;
};
