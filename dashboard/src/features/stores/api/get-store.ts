import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { StoreDetail } from '@/types/api';

import { getStoreKey } from '../keys';

export const getStore = async (id: string): Promise<StoreDetail> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  const store = await api.get<StoreDetail>(`/stores/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return store;
};

export const getStoreQueryOptions = (id: string) =>
  queryOptions({
    queryKey: getStoreKey(id),
    queryFn: () => getStore(id),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 15,
  });

type UseGetStoreOptions = {
  config?: QueryConfig<typeof getStoreQueryOptions>;
};

export const useGetStore = (
  id: string,
  { config }: UseGetStoreOptions = {},
) => {
  return useQuery({
    ...getStoreQueryOptions(id),
    enabled: Boolean(id),
    ...config,
  });
};
