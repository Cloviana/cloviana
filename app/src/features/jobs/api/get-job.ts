import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { jobKeys, QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

import type { JobWithRuntime } from '../types';

export const getJob = async (
  businessId: string,
  jobId: string,
): Promise<JobWithRuntime> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<JobWithRuntime>(`/businesses/${businessId}/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getJobQueryOptions = (businessId: string, jobId: string) =>
  queryOptions({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => getJob(businessId, jobId),
    staleTime: 15_000,
  });

type UseGetJobOptions = {
  queryConfig?: QueryConfig<typeof getJobQueryOptions>;
};

export const useGetJob = (
  businessId: string,
  jobId: string,
  { queryConfig }: UseGetJobOptions = {},
) =>
  useQuery({
    ...getJobQueryOptions(businessId, jobId),
    ...queryConfig,
  });
