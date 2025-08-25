import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Keyword } from '@/types/api';

import { keywordsKeys } from '../keys';

export const getKeywords = async (storeId: string): Promise<Keyword[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<Keyword[]>(`/stores/${storeId}/keywords`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

export const getKeywordsQueryOptions = (storeId: string) =>
  queryOptions({
    queryKey: keywordsKeys.list(storeId),
    queryFn: () => getKeywords(storeId),
  });

type UseGetKeywordsOptions = {
  queryConfig?: QueryConfig<typeof getKeywordsQueryOptions>;
};

export const useGetKeywords = (
  storeId: string,
  { queryConfig }: UseGetKeywordsOptions = {},
) => {
  return useQuery({
    ...getKeywordsQueryOptions(storeId),
    ...queryConfig,
  });
};
