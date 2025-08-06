import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { Keyword } from '@/types/api';

import { keywordsKeys } from '../keys';

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
  const response = await api.get<Keyword[]>(`/stores/${storeId}/keywords`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return response;
};

export const getKeywordsQueryOptions = (
  storeId: string,
  params: GetKeywordsParams,
) =>
  queryOptions({
    queryKey: keywordsKeys.list(params.type),
    queryFn: () => getKeywords(storeId, params),
  });

type UseGetKeywordsOptions = {
  storeId: string;
  params: GetKeywordsParams;
  queryConfig?: QueryConfig<typeof getKeywordsQueryOptions>;
};

export const useGetKeywords = ({
  storeId,
  params,
  queryConfig,
}: UseGetKeywordsOptions) => {
  return useQuery({
    ...getKeywordsQueryOptions(storeId, params),
    ...queryConfig,
  });
};
