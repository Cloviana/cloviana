import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { blogKeys, QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Blog } from '@/types/api';

export const getBlogs = async (storeId: string): Promise<Blog[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<Blog[]>(`/stores/${storeId}/blogs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getBlogsQueryOptions = (storeId: string) =>
  queryOptions({
    queryKey: blogKeys.all,
    queryFn: () => getBlogs(storeId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: Boolean(storeId),
  });

type UseGetBlogsOptions = {
  config?: QueryConfig<typeof getBlogsQueryOptions>;
};

export const useGetBlogs = (
  storeId: string,
  { config }: UseGetBlogsOptions = {},
) =>
  useQuery({
    ...getBlogsQueryOptions(storeId),
    ...config,
  });
