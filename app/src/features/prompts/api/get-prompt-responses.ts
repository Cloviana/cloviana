import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { PromptResponseListFilters, PromptResponsePage } from '../types';

export type GetPromptResponsesInput = PromptResponseListFilters & {
  businessId: string;
  page?: number;
  limit?: number;
};

export const getPromptResponses = async ({
  businessId,
  page = 1,
  limit = 25,
  ...filters
}: GetPromptResponsesInput): Promise<PromptResponsePage> => {
  const headers = await getAuthHeaders();

  return api.get<PromptResponsePage>(
    `/businesses/${businessId}/prompts/responses`,
    {
      headers,
      params: {
        page,
        limit,
        engines: filters.engines?.join(','),
        promptIds: filters.promptIds?.join(','),
        topicIds: filters.topicIds?.join(','),
        tagIds: filters.tagIds?.join(','),
        webSearch: filters.webSearch,
      },
    },
  );
};

export const getPromptResponsesQueryOptions = (
  input: GetPromptResponsesInput,
) => {
  const { businessId, page = 1, limit = 25, ...filters } = input;
  const query = { page, limit, ...filters };

  return queryOptions({
    queryKey: promptKeys.responseList(businessId, query),
    queryFn: () => getPromptResponses({ businessId, ...query }),
    enabled: Boolean(businessId),
  });
};

type UseGetPromptResponsesOptions = {
  queryConfig?: QueryConfig<typeof getPromptResponsesQueryOptions>;
};

export const useGetPromptResponses = (
  input: GetPromptResponsesInput,
  { queryConfig }: UseGetPromptResponsesOptions = {},
) =>
  useQuery({
    ...getPromptResponsesQueryOptions(input),
    ...queryConfig,
  });
