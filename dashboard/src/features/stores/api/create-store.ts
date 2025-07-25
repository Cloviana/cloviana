import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { Store } from '@/types/api';

import { getStoresKey } from '../keys';

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
      queryClient.setQueryData<Store[]>(getStoresKey(), (old = []) => [
        ...old,
        newStore,
      ]);

      if (config?.onSuccess) {
        config.onSuccess(newStore, variables, context);
      }
    },
    ...config,
  });
};
