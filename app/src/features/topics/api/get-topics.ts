import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig, topicKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { Topic } from '../types';

export const getTopics = async (businessId: string): Promise<Topic[]> => {
  const headers = await getAuthHeaders();

  return api.get<Topic[]>(`/businesses/${businessId}/topics`, { headers });
};

export const getTopicsQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: topicKeys.list(businessId),
    queryFn: () => getTopics(businessId),
    enabled: Boolean(businessId),
  });

type UseGetTopicsOptions = {
  queryConfig?: QueryConfig<typeof getTopicsQueryOptions>;
};

export const useGetTopics = (
  businessId: string,
  { queryConfig }: UseGetTopicsOptions = {},
) =>
  useQuery({
    ...getTopicsQueryOptions(businessId),
    ...queryConfig,
  });
