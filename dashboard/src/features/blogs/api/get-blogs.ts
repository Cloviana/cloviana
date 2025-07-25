import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Blog } from '@/types/api';

import { getBlogsKey } from '../keys';

export const getBlogs = async (storeId: string): Promise<Blog[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<Blog[]>(`/blogs`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { storeId },
  });
  return response;
};

export const getBlogsQueryOptions = (storeId: string) =>
  queryOptions({
    queryKey: getBlogsKey(storeId),
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
) => {
  return useQuery({
    ...getBlogsQueryOptions(storeId),
    ...config,
  });
};
