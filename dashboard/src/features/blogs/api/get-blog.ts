import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { BlogDetail } from '@/types/api';

import { getBlogKey } from '../keys';

export const getBlog = async (blogId: string): Promise<BlogDetail> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<BlogDetail>(`/blogs/${blogId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

export const getBlogQueryOptions = (blogId: string) =>
  queryOptions({
    queryKey: getBlogKey(blogId),
    queryFn: () => getBlog(blogId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: Boolean(blogId),
  });

type UseGetBlogOptions = {
  config?: QueryConfig<typeof getBlogQueryOptions>;
};

export const useGetBlog = (
  blogId: string,
  { config }: UseGetBlogOptions = {},
) => {
  return useQuery({
    ...getBlogQueryOptions(blogId),
    ...config,
  });
};
