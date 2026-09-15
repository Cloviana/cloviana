import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { PromptUrlTypes } from '../types';

export type GetPromptUrlTypesInput = {
  businessId: string;
  promptId: string;
  from: string;
  to: string;
};

export const getPromptUrlTypes = async ({
  businessId,
  promptId,
  from,
  to,
}: GetPromptUrlTypesInput): Promise<PromptUrlTypes> => {
  const headers = await getAuthHeaders();

  return api.get<PromptUrlTypes>(
    `/businesses/${businessId}/prompts/${promptId}/metrics/url-types`,
    {
      headers,
      params: { from, to },
    },
  );
};

export const getPromptUrlTypesQueryOptions = ({
  businessId,
  promptId,
  from,
  to,
}: GetPromptUrlTypesInput) => {
  const query = { from, to };

  return queryOptions({
    queryKey: promptKeys.urlTypes(businessId, promptId, query),
    queryFn: () => getPromptUrlTypes({ businessId, promptId, ...query }),
    enabled: Boolean(businessId && promptId && from && to),
  });
};

type UseGetPromptUrlTypesOptions = {
  queryConfig?: QueryConfig<typeof getPromptUrlTypesQueryOptions>;
};

export const useGetPromptUrlTypes = (
  input: GetPromptUrlTypesInput,
  { queryConfig }: UseGetPromptUrlTypesOptions = {},
) =>
  useQuery({
    ...getPromptUrlTypesQueryOptions(input),
    ...queryConfig,
  });
