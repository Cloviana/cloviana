import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { brandKitKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { BrandKit } from '../types';

export const getBrandKit = async (businessId: string): Promise<BrandKit> => {
  const headers = await getAuthHeaders();

  return api.get<BrandKit>(`/businesses/${businessId}/brand-kit`, {
    headers,
  });
};

export const getBrandKitQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: brandKitKeys.detail(businessId),
    queryFn: () => getBrandKit(businessId),
    enabled: Boolean(businessId),
  });

type UseGetBrandKitOptions = {
  queryConfig?: QueryConfig<typeof getBrandKitQueryOptions>;
};

export const useGetBrandKit = (
  businessId: string,
  { queryConfig }: UseGetBrandKitOptions = {},
) =>
  useQuery({
    ...getBrandKitQueryOptions(businessId),
    ...queryConfig,
  });
