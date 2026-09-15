import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { PromptRanking } from '../types';

export type GetPromptRankingInput = {
  businessId: string;
  promptId: string;
  from: string;
  to: string;
};

export const getPromptRanking = async ({
  businessId,
  promptId,
  from,
  to,
}: GetPromptRankingInput): Promise<PromptRanking> => {
  const headers = await getAuthHeaders();

  return api.get<PromptRanking>(
    `/businesses/${businessId}/prompts/${promptId}/metrics/ranking`,
    {
      headers,
      params: { from, to },
    },
  );
};

export const getPromptRankingQueryOptions = ({
  businessId,
  promptId,
  from,
  to,
}: GetPromptRankingInput) => {
  const query = { from, to };

  return queryOptions({
    queryKey: promptKeys.ranking(businessId, promptId, query),
    queryFn: () => getPromptRanking({ businessId, promptId, ...query }),
    enabled: Boolean(businessId && promptId && from && to),
  });
};

type UseGetPromptRankingOptions = {
  queryConfig?: QueryConfig<typeof getPromptRankingQueryOptions>;
};

export const useGetPromptRanking = (
  input: GetPromptRankingInput,
  { queryConfig }: UseGetPromptRankingOptions = {},
) =>
  useQuery({
    ...getPromptRankingQueryOptions(input),
    ...queryConfig,
  });
