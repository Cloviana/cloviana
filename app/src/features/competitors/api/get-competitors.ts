import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { competitorKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Competitor } from '@/types/api';

export const getCompetitors = async (
  businessId: string,
): Promise<Competitor[]> => {
  const headers = await getAuthHeaders();

  return api.get<Competitor[]>(`/businesses/${businessId}/competitors`, {
    headers,
  });
};

export const getCompetitorsQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: competitorKeys.list(businessId),
    queryFn: () => getCompetitors(businessId),
    enabled: Boolean(businessId),
  });

type UseGetCompetitorsOptions = {
  queryConfig?: QueryConfig<typeof getCompetitorsQueryOptions>;
};

export const useGetCompetitors = (
  businessId: string,
  { queryConfig }: UseGetCompetitorsOptions = {},
) =>
  useQuery({
    ...getCompetitorsQueryOptions(businessId),
    ...queryConfig,
  });
