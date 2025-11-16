import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export const createCheckoutSessionInputSchema = z.object({
  storeId: z.string().min(1, 'Store is required'),
  priceId: z.string().min(1, 'Price is required'),
});

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionInputSchema
>;

type CreateCheckoutSessionResponse = { url: string };

export const createCheckoutSession = async ({
  data,
}: {
  data: CreateCheckoutSessionInput;
}): Promise<CreateCheckoutSessionResponse> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }

  return api.post<CreateCheckoutSessionResponse>(
    `/stores/${data.storeId}/billing/checkout`,
    { priceId: data.priceId },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
};

type UseCreateCheckoutSessionOptions = {
  mutationConfig?: MutationConfig<typeof createCheckoutSession>;
};

export const useCreateCheckoutSession = ({
  mutationConfig,
}: UseCreateCheckoutSessionOptions = {}) => {
  return useMutation({
    mutationFn: createCheckoutSession,
    ...mutationConfig,
  });
};
