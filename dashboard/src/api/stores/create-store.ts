import { useMutation, useQueryClient } from '@tanstack/react-query';
import z from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { Store } from '@/types/api';

import { storeKeys } from '../keys';

export const createStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(120),
  domainUrl: z
    .string()
    .trim()
    .regex(
      /^(?!https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
      'Enter a valid domain URL without protocol',
    ),
});

export type CreateStoreData = {
  name: string;
  domainUrl: string;
};

export const createStore = async ({
  ...payload
}: CreateStoreData): Promise<Store> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }

  const response = await api.post<Store>(`/stores`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response;
};

type UseCreateStoreOptions = {
  config?: MutationConfig<typeof createStore>;
};

export const useCreateStore = ({ config }: UseCreateStoreOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStore,
    onSuccess: (newStore, variables, context) => {
      queryClient.setQueryData<Store[]>(
        storeKeys.detail(newStore.id),
        (old = []) => [...old, newStore],
      );

      if (config?.onSuccess) {
        config.onSuccess(newStore, variables, context);
      }
    },
    ...config,
  });
};
