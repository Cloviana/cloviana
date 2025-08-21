import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Job } from '@/types/api';

import { jobsKeys } from '../keys';

export const getJob = async (storeId: string, jobId: string): Promise<Job> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<Job>(`/stores/${storeId}/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getJobQueryOptions = (storeId: string, jobId: string) =>
  queryOptions({
    queryKey: jobsKeys.detail(storeId, jobId),
    queryFn: () => getJob(storeId, jobId),
    staleTime: 15_000,
  });

type UseGetJobOptions = {
  queryConfig?: QueryConfig<typeof getJobQueryOptions>;
};

export const useGetJob = (
  storeId: string,
  jobId: string,
  { queryConfig }: UseGetJobOptions = {},
) =>
  useQuery({
    ...getJobQueryOptions(storeId, jobId),
    ...queryConfig,
  });
