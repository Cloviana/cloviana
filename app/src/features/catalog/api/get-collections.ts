import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { catalogKeys } from '@/lib/react-query/keys';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Collection, PaginatedResponse } from '@/types/api';

type GetCollectionsParams = {
  page?: number;
  limit?: number;
};

type CollectionsResponse = PaginatedResponse<Collection[]>;

export const getCollections = async (
  storeId: string,
  params?: GetCollectionsParams,
): Promise<CollectionsResponse> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  const response = await api.get<CollectionsResponse>(
    `/stores/${storeId}/catalog/collections`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params,
    },
  );
  return response;
};

export const getCollectionsQueryOptions = (
  storeId: string,
  params?: GetCollectionsParams,
) =>
  queryOptions({
    queryKey: catalogKeys.collections(storeId, params),
    queryFn: () => getCollections(storeId, params),
  });

type UseGetCollectionsOptions = {
  storeId: string;
  params?: GetCollectionsParams;
  queryConfig?: QueryConfig<typeof getCollectionsQueryOptions>;
};

export const useGetCollections = ({
  storeId,
  params,
  queryConfig,
}: UseGetCollectionsOptions) => {
  return useQuery({
    ...getCollectionsQueryOptions(storeId, params),
    ...queryConfig,
  });
};
