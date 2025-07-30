import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Store } from '@/types/api';

export const getStoresKey = () => ['stores'] as const;

export const getStores = async (): Promise<Store[]> => {
  const accessToken = await fetchAccessToken();
  if (!accessToken) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<Store[]>(`/stores`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response;
};

export const getStoresQueryOptions = () => {
  return queryOptions({
    queryKey: getStoresKey(),
    queryFn: () => getStores(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

type UseGetStoresOptions = {
  config?: QueryConfig<typeof getStoresQueryOptions>;
};

export const useGetStores = ({ config }: UseGetStoresOptions = {}) => {
  return useQuery({
    ...getStoresQueryOptions(),
    ...config,
  });
};
