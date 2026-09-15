import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { PromptResponseDetail } from '../types';

export type GetPromptResponseInput = {
  businessId: string;
  responseId: string;
};

export const getPromptResponse = async ({
  businessId,
  responseId,
}: GetPromptResponseInput): Promise<PromptResponseDetail> => {
  const headers = await getAuthHeaders();

  return api.get<PromptResponseDetail>(
    `/businesses/${businessId}/prompts/responses/${responseId}`,
    { headers },
  );
};

export const getPromptResponseQueryOptions = ({
  businessId,
  responseId,
}: GetPromptResponseInput) =>
  queryOptions({
    queryKey: promptKeys.responseDetail(businessId, responseId),
    queryFn: () => getPromptResponse({ businessId, responseId }),
    enabled: Boolean(businessId && responseId),
  });

type UseGetPromptResponseOptions = {
  queryConfig?: QueryConfig<typeof getPromptResponseQueryOptions>;
};

export const useGetPromptResponse = (
  input: GetPromptResponseInput,
  { queryConfig }: UseGetPromptResponseOptions = {},
) =>
  useQuery({
    ...getPromptResponseQueryOptions(input),
    ...queryConfig,
  });
