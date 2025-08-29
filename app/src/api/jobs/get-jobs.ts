import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Job, JobType } from '@/types/api';

import { jobsKeys } from '../keys';

export const getJobs = async (
  storeId: string,
  type?: JobType,
  limit?: number,
): Promise<Job[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  return api.get<Job[]>(`/stores/${storeId}/jobs`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { type, limit },
  });
};

export const getJobsQueryOptions = (
  storeId: string,
  type?: JobType,
  limit?: number,
) =>
  queryOptions({
    queryKey: jobsKeys.list(storeId),
    queryFn: () => getJobs(storeId, type, limit),
    staleTime: 30_000,
  });

type UseGetJobsOptions = {
  queryConfig?: QueryConfig<typeof getJobsQueryOptions>;
};

export const useGetJobs = (
  storeId: string,
  type?: JobType,
  limit?: number,
  { queryConfig }: UseGetJobsOptions = {},
) =>
  useQuery({
    ...getJobsQueryOptions(storeId, type, limit),
    ...queryConfig,
  });
