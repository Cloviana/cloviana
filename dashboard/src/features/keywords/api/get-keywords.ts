import { useQuery } from '@tanstack/react-query';

import { getStoreKey } from '@/features/stores/keys';
import { api } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { Keyword } from '@/types/api';

export type GetKeywordsParams = {
  type: 'BLOG' | 'BUSINESS';
};

export const getKeywords = async (
  storeId: string,
  params: GetKeywordsParams,
): Promise<Keyword[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }

  const data = await api.get<Keyword[]>(`/stores/${storeId}/keywords`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });

  return data;
};

export const getKeywordsKey = (storeId: string, params: GetKeywordsParams) =>
  [...getStoreKey(storeId), 'keywords', params] as const;

export const getKeywordsQueryOptions = (
  storeId: string,
  params: GetKeywordsParams,
) =>
  ({
    queryKey: getKeywordsKey(storeId, params),
    queryFn: () => getKeywords(storeId, params),
    staleTime: 1000 * 60,
    keepPreviousData: true,
    gcTime: 1000 * 60 * 15,
  }) as const;

type UseGetKeywordsOptions = {
  config?: QueryConfig<typeof getKeywordsQueryOptions>;
};

export const useGetKeywords = (
  storeId: string,
  params: GetKeywordsParams,
  { config }: UseGetKeywordsOptions = {},
) => {
  return useQuery({
    ...getKeywordsQueryOptions(storeId, params),
    enabled: Boolean(storeId && params.type),
    ...config,
  });
};
