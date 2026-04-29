import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Job } from '@/types/api';

import { jobsKeys } from '../keys';

export const getJob = async (
  businessId: string,
  jobId: string,
): Promise<Job> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<Job>(`/businesses/${businessId}/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getJobQueryOptions = (businessId: string, jobId: string) =>
  queryOptions({
    queryKey: jobsKeys.detail(businessId, jobId),
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
