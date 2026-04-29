import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig, businessKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import { Business } from '@/types/api';

export const getBusiness = async (id: string): Promise<Business> => {
  const headers = await getAuthHeaders();
  const business = await api.get<Business>(`/businesses/${id}`, {
    headers,
  });
  return business;
};

export const getBusinessQueryOptions = (id: string) =>
  queryOptions({
    queryKey: businessKeys.detail(id),
    queryFn: () => getBusiness(id),
    enabled: Boolean(id),
  });

type UseGetBusinessOptions = {
  config?: QueryConfig<typeof getBusinessQueryOptions>;
};

export const useGetBusiness = (
  id: string,
  { config }: UseGetBusinessOptions = {},
) => {
  return useQuery({
    ...getBusinessQueryOptions(id),
    ...config,
  });
};
