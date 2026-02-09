import { useInfiniteQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { catalogKeys } from '@/lib/react-query/keys';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { CursorPaginatedResponse, Collection } from '@/types/api';

type GetCollectionsParams = {
  limit?: number;
  q?: string;
  cursor?: string;
};

type CollectionsResponse = CursorPaginatedResponse<Collection>;

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

type UseGetCollectionsOptions = {
  storeId: string;
  params?: Omit<GetCollectionsParams, 'cursor'>;
  enabled?: boolean;
};

export const useGetCollections = ({
  storeId,
  params,
  enabled,
}: UseGetCollectionsOptions) => {
  return useInfiniteQuery({
    queryKey: catalogKeys.collections(storeId, params),
    queryFn: ({ pageParam }) =>
      getCollections(storeId, {
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    enabled,
  });
};
