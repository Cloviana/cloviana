import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig, businessKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Business } from '@/types/api';

export type BusinessListItem = Pick<Business, 'id' | 'brand' | 'profileUrl'>;

export const getBusinesses = async (): Promise<BusinessListItem[]> => {
  const headers = await getAuthHeaders();
  return api.get<BusinessListItem[]>('/businesses', {
    headers,
  });
};

export const getBusinessesQueryOptions = () =>
  queryOptions({
    queryKey: businessKeys.list(),
    queryFn: getBusinesses,
  });

type UseBusinessesOptions = {
  config?: QueryConfig<typeof getBusinessesQueryOptions>;
};

export const useBusinesses = ({ config }: UseBusinessesOptions = {}) => {
  return useQuery({
    ...getBusinessesQueryOptions(),
    ...config,
  });
};
