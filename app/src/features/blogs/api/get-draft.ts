import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { blogKeys, QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

import type { BlogDraft } from '../types';

export const getDraft = async (
  businessId: string,
  draftId: string,
): Promise<BlogDraft> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<BlogDraft>(
    `/businesses/${businessId}/blogs/drafts/${draftId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

export const getDraftQueryOptions = (businessId: string, draftId: string) =>
  queryOptions({
    queryKey: blogKeys.draft(businessId, draftId),
    queryFn: () => getDraft(businessId, draftId),
  });

type UseGetDraftOptions = {
  queryConfig?: QueryConfig<typeof getDraftQueryOptions>;
};

export const useGetDraft = (
  businessId: string,
  draftId: string,
  { queryConfig }: UseGetDraftOptions = {},
) =>
  useQuery({
    ...getDraftQueryOptions(businessId, draftId),
    ...queryConfig,
  });
