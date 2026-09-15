import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig, tagKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { Tag } from '../types';

export const getTags = async (businessId: string): Promise<Tag[]> => {
  const headers = await getAuthHeaders();

  return api.get<Tag[]>(`/businesses/${businessId}/tags`, { headers });
};

export const getTagsQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: tagKeys.list(businessId),
    queryFn: () => getTags(businessId),
    enabled: Boolean(businessId),
  });

type UseGetTagsOptions = {
  queryConfig?: QueryConfig<typeof getTagsQueryOptions>;
};

export const useGetTags = (
  businessId: string,
  { queryConfig }: UseGetTagsOptions = {},
) =>
  useQuery({
    ...getTagsQueryOptions(businessId),
    ...queryConfig,
  });
