import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { JobStatus, JobType } from '@/types/api';

import { jobsKeys } from '../keys';

export const getLatestJobStatus = async (
  businessId: string,
  type: JobType,
): Promise<{ status: JobStatus | null; jobId: string | null }> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get(`/businesses/${businessId}/jobs/latest/status`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { type },
  });
};

export const getLatestJobStatusQueryOptions = (
  businessId: string,
  type: JobType,
) =>
  queryOptions({
    queryKey: jobsKeys.latestStatus(businessId, type),
    queryFn: () => getLatestJobStatus(businessId, type),
    staleTime: 10_000,
  });

type UseGetLatestJobStatusOptions = {
  queryConfig?: QueryConfig<typeof getLatestJobStatusQueryOptions>;
};

export const useGetLatestJobStatus = (
  businessId: string,
  type: JobType,
  { queryConfig }: UseGetLatestJobStatusOptions = {},
) =>
  useQuery({
    ...getLatestJobStatusQueryOptions(businessId, type),
    ...queryConfig,
  });
