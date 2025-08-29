import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { StoreStatus } from '@/types/api';

import { storeKeys } from '../keys';

export type StoreStatusResponse = {
  storeId: string;
  status: StoreStatus;
  lastUpdated: string;
};

export const getStoreStatus = async (
  id: string,
): Promise<StoreStatusResponse> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<StoreStatusResponse>(`/stores/${id}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getStoreStatusQueryOptions = (id: string) =>
  queryOptions({
    queryKey: storeKeys.status(id),
    queryFn: () => getStoreStatus(id),
  });

type UseGetStoreStatusOptions = {
  config?: QueryConfig<typeof getStoreStatusQueryOptions>;
};

export const useGetStoreStatus = (
  id: string,
  { config }: UseGetStoreStatusOptions = {},
) => {
  return useQuery({
    ...getStoreStatusQueryOptions(id),
    ...config,
  });
};
