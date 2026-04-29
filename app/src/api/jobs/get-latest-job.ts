import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Job, JobType } from '@/types/api';

import { jobsKeys } from '../keys';

export const getLatestJob = async (
  businessId: string,
  type: JobType,
): Promise<Job | null> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<Job | null>(`/businesses/${businessId}/jobs/latest`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { type },
  });
};

export const getLatestJobQueryOptions = (businessId: string, type: JobType) =>
  queryOptions({
    queryKey: jobsKeys.latest(businessId, type),
    queryFn: () => getLatestJob(businessId, type),
    staleTime: 15_000,
  });

type UseGetLatestJobOptions = {
  queryConfig?: QueryConfig<typeof getLatestJobQueryOptions>;
};

export const useGetLatestJob = (
  businessId: string,
  type: JobType,
  { queryConfig }: UseGetLatestJobOptions = {},
) =>
  useQuery({
    ...getLatestJobQueryOptions(businessId, type),
    ...queryConfig,
  });
