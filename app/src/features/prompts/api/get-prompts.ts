import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { PromptListFilters, PromptPage } from '../types';

export type GetPromptsInput = PromptListFilters & {
  businessId: string;
  page?: number;
  limit?: number;
};

export const getPrompts = async ({
  businessId,
  page = 1,
  limit = 25,
  ...filters
}: GetPromptsInput): Promise<PromptPage> => {
  const headers = await getAuthHeaders();

  return api.get<PromptPage>(`/businesses/${businessId}/prompts`, {
    headers,
    params: {
      page,
      limit,
      ...filters,
      topicIds: filters.topicIds?.join(','),
      tagIds: filters.tagIds?.join(','),
      branding: filters.branding?.join(','),
      stages: filters.stages?.join(','),
    },
  });
};

export const getPromptsQueryOptions = (input: GetPromptsInput) => {
  const { businessId, page = 1, limit = 25, ...filters } = input;
  const query = { page, limit, ...filters };

  return queryOptions({
    queryKey: promptKeys.list(businessId, query),
    queryFn: () => getPrompts({ businessId, ...query }),
    enabled: Boolean(businessId),
  });
};

type UseGetPromptsOptions = {
  queryConfig?: QueryConfig<typeof getPromptsQueryOptions>;
};

export const useGetPrompts = (
  input: GetPromptsInput,
  { queryConfig }: UseGetPromptsOptions = {},
) =>
  useQuery({
    ...getPromptsQueryOptions(input),
    ...queryConfig,
  });
