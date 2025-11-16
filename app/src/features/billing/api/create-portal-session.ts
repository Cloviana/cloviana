import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export const createPortalSessionInputSchema = z.object({
  storeId: z.string().min(1, 'Store is required'),
});

export type CreatePortalSessionInput = z.infer<
  typeof createPortalSessionInputSchema
>;

type CreatePortalSessionResponse = { url: string };

export const createPortalSession = async ({
  data,
}: {
  data: CreatePortalSessionInput;
}): Promise<CreatePortalSessionResponse> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }

  return api.post<CreatePortalSessionResponse>(
    `/stores/${data.storeId}/billing/portal`,
    undefined,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
};

type UseCreatePortalSessionOptions = {
  mutationConfig?: MutationConfig<typeof createPortalSession>;
};

export const useCreatePortalSession = ({
  mutationConfig,
}: UseCreatePortalSessionOptions = {}) => {
  return useMutation({
    mutationFn: createPortalSession,
    ...mutationConfig,
  });
};
