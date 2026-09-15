import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { ClaimSentiment, PromptBrandPerceptionPage } from '../types';

export type GetPromptBrandPerceptionInput = {
  businessId: string;
  promptId: string;
  page?: number;
  limit?: number;
  sentiment?: ClaimSentiment;
};

export const getPromptBrandPerception = async ({
  businessId,
  promptId,
  page = 1,
  limit = 5,
  sentiment,
}: GetPromptBrandPerceptionInput): Promise<PromptBrandPerceptionPage> => {
  const headers = await getAuthHeaders();

  return api.get<PromptBrandPerceptionPage>(
    `/businesses/${businessId}/prompts/${promptId}/brand-perception`,
    {
      headers,
      params: { page, limit, sentiment },
    },
  );
};

export const getPromptBrandPerceptionQueryOptions = ({
  businessId,
  promptId,
  page = 1,
  limit = 5,
  sentiment,
}: GetPromptBrandPerceptionInput) => {
  const query = { page, limit, sentiment };

  return queryOptions({
    queryKey: promptKeys.brandPerception(businessId, promptId, query),
    queryFn: () => getPromptBrandPerception({ businessId, promptId, ...query }),
    enabled: Boolean(businessId && promptId),
  });
};

type UseGetPromptBrandPerceptionOptions = {
  queryConfig?: QueryConfig<typeof getPromptBrandPerceptionQueryOptions>;
};

export const useGetPromptBrandPerception = (
  input: GetPromptBrandPerceptionInput,
  { queryConfig }: UseGetPromptBrandPerceptionOptions = {},
) =>
  useQuery({
    ...getPromptBrandPerceptionQueryOptions(input),
    ...queryConfig,
  });
