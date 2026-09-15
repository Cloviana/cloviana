import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { MentionRateGranularity, PromptMentionRate } from '../types';

export type GetPromptMentionRateInput = {
  businessId: string;
  promptId: string;
  from: string;
  to: string;
  granularity?: MentionRateGranularity;
};

export const getPromptMentionRate = async ({
  businessId,
  promptId,
  from,
  to,
  granularity = 'day',
}: GetPromptMentionRateInput): Promise<PromptMentionRate> => {
  const headers = await getAuthHeaders();

  return api.get<PromptMentionRate>(
    `/businesses/${businessId}/prompts/${promptId}/metrics/mention-rate`,
    {
      headers,
      params: { from, to, granularity },
    },
  );
};

export const getPromptMentionRateQueryOptions = ({
  businessId,
  promptId,
  from,
  to,
  granularity = 'day',
}: GetPromptMentionRateInput) => {
  const query = { from, to, granularity };

  return queryOptions({
    queryKey: promptKeys.mentionRate(businessId, promptId, query),
    queryFn: () => getPromptMentionRate({ businessId, promptId, ...query }),
    enabled: Boolean(businessId && promptId && from && to),
  });
};

type UseGetPromptMentionRateOptions = {
  queryConfig?: QueryConfig<typeof getPromptMentionRateQueryOptions>;
};

export const useGetPromptMentionRate = (
  input: GetPromptMentionRateInput,
  { queryConfig }: UseGetPromptMentionRateOptions = {},
) =>
  useQuery({
    ...getPromptMentionRateQueryOptions(input),
    ...queryConfig,
  });
