import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { PromptSourceUrls, PromptSourceView } from '../types';

export type GetPromptSourceUrlsInput = {
  businessId: string;
  promptId: string;
  from: string;
  to: string;
  view?: PromptSourceView;
  limit?: number;
};

export const getPromptSourceUrls = async ({
  businessId,
  promptId,
  from,
  to,
  view = 'top',
  limit = 8,
}: GetPromptSourceUrlsInput): Promise<PromptSourceUrls> => {
  const headers = await getAuthHeaders();

  return api.get<PromptSourceUrls>(
    `/businesses/${businessId}/prompts/${promptId}/metrics/source-urls`,
    {
      headers,
      params: { from, to, view, limit },
    },
  );
};

export const getPromptSourceUrlsQueryOptions = ({
  businessId,
  promptId,
  from,
  to,
  view = 'top',
  limit = 8,
}: GetPromptSourceUrlsInput) => {
  const query = { from, to, view, limit };

  return queryOptions({
    queryKey: promptKeys.sourceUrls(businessId, promptId, query),
    queryFn: () => getPromptSourceUrls({ businessId, promptId, ...query }),
    enabled: Boolean(businessId && promptId && from && to),
  });
};

type UseGetPromptSourceUrlsOptions = {
  queryConfig?: QueryConfig<typeof getPromptSourceUrlsQueryOptions>;
};

export const useGetPromptSourceUrls = (
  input: GetPromptSourceUrlsInput,
  { queryConfig }: UseGetPromptSourceUrlsOptions = {},
) =>
  useQuery({
    ...getPromptSourceUrlsQueryOptions(input),
    ...queryConfig,
  });
