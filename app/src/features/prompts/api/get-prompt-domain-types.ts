import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { PromptDomainTypes } from '../types';

export type GetPromptDomainTypesInput = {
  businessId: string;
  promptId: string;
  from: string;
  to: string;
};

export const getPromptDomainTypes = async ({
  businessId,
  promptId,
  from,
  to,
}: GetPromptDomainTypesInput): Promise<PromptDomainTypes> => {
  const headers = await getAuthHeaders();

  return api.get<PromptDomainTypes>(
    `/businesses/${businessId}/prompts/${promptId}/metrics/domain-types`,
    {
      headers,
      params: { from, to },
    },
  );
};

export const getPromptDomainTypesQueryOptions = ({
  businessId,
  promptId,
  from,
  to,
}: GetPromptDomainTypesInput) => {
  const query = { from, to };

  return queryOptions({
    queryKey: promptKeys.domainTypes(businessId, promptId, query),
    queryFn: () => getPromptDomainTypes({ businessId, promptId, ...query }),
    enabled: Boolean(businessId && promptId && from && to),
  });
};

type UseGetPromptDomainTypesOptions = {
  queryConfig?: QueryConfig<typeof getPromptDomainTypesQueryOptions>;
};

export const useGetPromptDomainTypes = (
  input: GetPromptDomainTypesInput,
  { queryConfig }: UseGetPromptDomainTypesOptions = {},
) =>
  useQuery({
    ...getPromptDomainTypesQueryOptions(input),
    ...queryConfig,
  });
