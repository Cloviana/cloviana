import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { BlogDetail } from '@/types/api';

import { blogsKeys } from '../keys';

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
    queryKey: blogsKeys.detail(blogId),
    queryFn: () => getBlog(blogId),
  });

type UseGetBlogOptions = {
  blogId: string;
  queryConfig?: QueryConfig<typeof getBlogQueryOptions>;
};

export const useGetBlog = ({ blogId, queryConfig }: UseGetBlogOptions) => {
  return useQuery({
    ...getBlogQueryOptions(blogId),
    ...queryConfig,
  });
};
