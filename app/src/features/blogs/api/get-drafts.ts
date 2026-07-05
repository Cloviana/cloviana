import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { blogKeys, QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

import type { BlogDraftSummary } from '../types';

export const getDrafts = async (
  businessId: string,
): Promise<BlogDraftSummary[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<BlogDraftSummary[]>(`/businesses/${businessId}/blogs/drafts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getDraftsQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: blogKeys.drafts(businessId),
    queryFn: () => getDrafts(businessId),
  });

type UseGetDraftsOptions = {
  queryConfig?: QueryConfig<typeof getDraftsQueryOptions>;
};

export const useGetDrafts = (
  businessId: string,
  { queryConfig }: UseGetDraftsOptions = {},
) =>
  useQuery({
    ...getDraftsQueryOptions(businessId),
    ...queryConfig,
  });
