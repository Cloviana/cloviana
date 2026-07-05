import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { jobKeys, QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { Job } from '@/types/api';

export const getJobs = async (businessId: string): Promise<Job[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<Job[]>(`/businesses/${businessId}/jobs?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getJobsQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: jobKeys.list(businessId),
    queryFn: () => getJobs(businessId),
    // Keep the task board live while anything is still running.
    refetchInterval: (query) =>
      query.state.data?.some((job) =>
        ['PENDING', 'RUNNING'].includes(job.status),
      )
        ? 5000
        : false,
  });

type UseGetJobsOptions = {
  queryConfig?: QueryConfig<typeof getJobsQueryOptions>;
};

export const useGetJobs = (
  businessId: string,
  { queryConfig }: UseGetJobsOptions = {},
) =>
  useQuery({
    ...getJobsQueryOptions(businessId),
    ...queryConfig,
  });
