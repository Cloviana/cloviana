import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { JobStatus, JobType } from '@/types/api';

import { jobsKeys } from '../keys';

export const getLatestJobStatus = async (
  storeId: string,
  type: JobType,
): Promise<{ status: JobStatus | null; jobId: string | null }> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get(`/stores/${storeId}/jobs/latest/status`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { type },
  });
};

export const getLatestJobStatusQueryOptions = (
  storeId: string,
  type: JobType,
) =>
  queryOptions({
    queryKey: jobsKeys.latestStatus(storeId, type),
    queryFn: () => getLatestJobStatus(storeId, type),
    staleTime: 10_000,
  });

type UseGetLatestJobStatusOptions = {
  queryConfig?: QueryConfig<typeof getLatestJobStatusQueryOptions>;
};

export const useGetLatestJobStatus = (
  storeId: string,
  type: JobType,
  { queryConfig }: UseGetLatestJobStatusOptions = {},
) =>
  useQuery({
    ...getLatestJobStatusQueryOptions(storeId, type),
    ...queryConfig,
  });
