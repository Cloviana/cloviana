import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { GenerationStatus } from '@/types/api';

import { getBlogGenerationStatusKey } from '../keys';

export type BlogGenerationStatusResponse = {
  id: string;
  status: GenerationStatus;
  lastUpdated: string;
};

export const getBlogGenerationStatus = async (
  blogId: string,
): Promise<BlogGenerationStatusResponse> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<BlogGenerationStatusResponse>(`/blogs/${blogId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getBlogGenerationStatusQueryOptions = (
  blogId: string,
  pollInterval = 2000,
) =>
  queryOptions({
    queryKey: getBlogGenerationStatusKey(blogId),
    queryFn: () => getBlogGenerationStatus(blogId),
    staleTime: 0,
    gcTime: 1000 * 60 * 30,
    refetchInterval: ({ state }) =>
      state.data?.status === 'IN_PROGRESS' ? pollInterval : false,
  });

type UseGetBlogGenerationStatusOptions = {
  config?: QueryConfig<typeof getBlogGenerationStatusQueryOptions>;
  pollInterval?: number;
};

export const useGetBlogGenerationStatus = (
  blogId: string,
  { config = {}, pollInterval = 2000 }: UseGetBlogGenerationStatusOptions = {},
) =>
  useQuery({
    ...getBlogGenerationStatusQueryOptions(blogId, pollInterval),
    enabled: Boolean(blogId) && (config.enabled ?? true),
    ...config,
  });
