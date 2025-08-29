import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Job, JobType } from '@/types/api';

import { jobsKeys } from '../keys';

export const getLatestJob = async (
  storeId: string,
  type: JobType,
): Promise<Job | null> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<Job | null>(`/stores/${storeId}/jobs/latest`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { type },
  });
};

export const getLatestJobQueryOptions = (storeId: string, type: JobType) =>
  queryOptions({
    queryKey: jobsKeys.latest(storeId, type),
    queryFn: () => getLatestJob(storeId, type),
    staleTime: 15_000,
  });

type UseGetLatestJobOptions = {
  queryConfig?: QueryConfig<typeof getLatestJobQueryOptions>;
};

export const useGetLatestJob = (
  storeId: string,
  type: JobType,
  { queryConfig }: UseGetLatestJobOptions = {},
) =>
  useQuery({
    ...getLatestJobQueryOptions(storeId, type),
    ...queryConfig,
  });
