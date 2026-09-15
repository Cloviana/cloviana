import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { PromptSourceDomains, PromptSourceView } from '../types';

export type GetPromptSourceDomainsInput = {
  businessId: string;
  promptId: string;
  from: string;
  to: string;
  view?: PromptSourceView;
  limit?: number;
};

export const getPromptSourceDomains = async ({
  businessId,
  promptId,
  from,
  to,
  view = 'top',
  limit = 8,
}: GetPromptSourceDomainsInput): Promise<PromptSourceDomains> => {
  const headers = await getAuthHeaders();

  return api.get<PromptSourceDomains>(
    `/businesses/${businessId}/prompts/${promptId}/metrics/source-domains`,
    {
      headers,
      params: { from, to, view, limit },
    },
  );
};

export const getPromptSourceDomainsQueryOptions = ({
  businessId,
  promptId,
  from,
  to,
  view = 'top',
  limit = 8,
}: GetPromptSourceDomainsInput) => {
  const query = { from, to, view, limit };

  return queryOptions({
    queryKey: promptKeys.sourceDomains(businessId, promptId, query),
    queryFn: () => getPromptSourceDomains({ businessId, promptId, ...query }),
    enabled: Boolean(businessId && promptId && from && to),
  });
};

type UseGetPromptSourceDomainsOptions = {
  queryConfig?: QueryConfig<typeof getPromptSourceDomainsQueryOptions>;
};

export const useGetPromptSourceDomains = (
  input: GetPromptSourceDomainsInput,
  { queryConfig }: UseGetPromptSourceDomainsOptions = {},
) =>
  useQuery({
    ...getPromptSourceDomainsQueryOptions(input),
    ...queryConfig,
  });
