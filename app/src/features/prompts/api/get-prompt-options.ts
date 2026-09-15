import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { PromptOption } from '../types';

export const getPromptOptions = async (
  businessId: string,
): Promise<PromptOption[]> => {
  const headers = await getAuthHeaders();

  return api.get<PromptOption[]>(`/businesses/${businessId}/prompts/options`, {
    headers,
  });
};

export const getPromptOptionsQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: promptKeys.options(businessId),
    queryFn: () => getPromptOptions(businessId),
    enabled: Boolean(businessId),
  });

type UseGetPromptOptionsOptions = {
  queryConfig?: QueryConfig<typeof getPromptOptionsQueryOptions>;
};

export const useGetPromptOptions = (
  businessId: string,
  { queryConfig }: UseGetPromptOptionsOptions = {},
) =>
  useQuery({
    ...getPromptOptionsQueryOptions(businessId),
    ...queryConfig,
  });
