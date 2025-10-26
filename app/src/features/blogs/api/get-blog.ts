import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { BlogDetail } from '@/types/api';

export const getBlog = async (
  storeId: string,
  blogId: string,
): Promise<BlogDetail> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  const response = await api.get<BlogDetail>(
    `/stores/${storeId}/blogs/${blogId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response;
};

export const getBlogQueryOptions = (storeId: string, blogId: string) =>
  queryOptions({
    queryKey: ['blogs', 'detail', storeId, blogId],
    queryFn: () => getBlog(storeId, blogId),
  });

type UseGetBlogOptions = {
  storeId: string;
  blogId: string;
  queryConfig?: QueryConfig<typeof getBlogQueryOptions>;
};

export const useGetBlog = ({
  storeId,
  blogId,
  queryConfig,
}: UseGetBlogOptions) => {
  return useQuery({
    ...getBlogQueryOptions(storeId, blogId),
    ...queryConfig,
  });
};
