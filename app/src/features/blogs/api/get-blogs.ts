import { useInfiniteQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { blogKeys } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Blog, BlogStatus, CursorPaginatedResponse } from '@/types/api';

export type GetBlogsParams = {
  limit?: number;
  cursor?: string;
  q?: string;
  status?: BlogStatus;
};

export const getBlogs = async (
  storeId: string,
  params?: GetBlogsParams,
): Promise<CursorPaginatedResponse<Blog>> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  return api.get<CursorPaginatedResponse<Blog>>(`/stores/${storeId}/blogs`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
};

type UseGetBlogsOptions = {
  storeId: string;
  params?: Omit<GetBlogsParams, 'cursor'>;
  enabled?: boolean;
};

export const useGetBlogs = ({ storeId, params, enabled }: UseGetBlogsOptions) =>
  useInfiniteQuery({
    queryKey: blogKeys.list(storeId, params),
    queryFn: ({ pageParam }) =>
      getBlogs(storeId, {
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    enabled: Boolean(storeId) && enabled !== false,
  });
