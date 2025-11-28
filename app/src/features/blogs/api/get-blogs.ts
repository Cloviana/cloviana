import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { blogKeys, QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Blog, BlogStatus, PaginatedResponse } from '@/types/api';

export type GetBlogsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: BlogStatus;
};

export const getBlogs = async (
  storeId: string,
  params: GetBlogsParams,
): Promise<PaginatedResponse<Blog>> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);

  const queryString = query.toString();
  const url = queryString
    ? `/stores/${storeId}/blogs?${queryString}`
    : `/stores/${storeId}/blogs`;

  return api.get<PaginatedResponse<Blog>>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getBlogsQueryOptions = (
  storeId: string,
  params: GetBlogsParams = {},
) =>
  queryOptions({
    queryKey: blogKeys.list(storeId, params),
    queryFn: () => getBlogs(storeId, params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: Boolean(storeId),
  });

type UseGetBlogsOptions = {
  config?: QueryConfig<typeof getBlogsQueryOptions>;
  params?: GetBlogsParams;
};

export const useGetBlogs = (
  storeId: string,
  { config, params = {} }: UseGetBlogsOptions,
) =>
  useQuery({
    ...getBlogsQueryOptions(storeId, params),
    ...config,
  });
