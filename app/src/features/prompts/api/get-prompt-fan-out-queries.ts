import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { PromptFanOutQueryPage } from '../types';

export type GetPromptFanOutQueriesInput = {
  businessId: string;
  promptId: string;
  page?: number;
  limit?: number;
};

export const getPromptFanOutQueries = async ({
  businessId,
  promptId,
  page = 1,
  limit = 5,
}: GetPromptFanOutQueriesInput): Promise<PromptFanOutQueryPage> => {
  const headers = await getAuthHeaders();

  return api.get<PromptFanOutQueryPage>(
    `/businesses/${businessId}/prompts/${promptId}/fan-out-queries`,
    {
      headers,
      params: { page, limit },
    },
  );
};

export const getPromptFanOutQueriesQueryOptions = ({
  businessId,
  promptId,
  page = 1,
  limit = 5,
}: GetPromptFanOutQueriesInput) => {
  const query = { page, limit };

  return queryOptions({
    queryKey: promptKeys.fanOutQueries(businessId, promptId, query),
    queryFn: () => getPromptFanOutQueries({ businessId, promptId, ...query }),
    enabled: Boolean(businessId && promptId),
  });
};

type UseGetPromptFanOutQueriesOptions = {
  queryConfig?: QueryConfig<typeof getPromptFanOutQueriesQueryOptions>;
};

export const useGetPromptFanOutQueries = (
  input: GetPromptFanOutQueriesInput,
  { queryConfig }: UseGetPromptFanOutQueriesOptions = {},
) =>
  useQuery({
    ...getPromptFanOutQueriesQueryOptions(input),
    ...queryConfig,
  });
