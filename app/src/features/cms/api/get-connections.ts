import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { cmsKeys } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export type CmsConnection = {
  id: string;
  platform: 'WORDPRESS' | 'WEBFLOW' | 'FRAMER';
  lastSyncedAt: string | null;
};

export const getCmsConnections = async (
  businessId: string,
): Promise<CmsConnection[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<CmsConnection[]>(`/businesses/${businessId}/cms/connections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getCmsConnectionsQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: cmsKeys.connections(businessId),
    queryFn: () => getCmsConnections(businessId),
    staleTime: 60_000,
  });

export const useGetCmsConnections = (businessId: string) =>
  useQuery(getCmsConnectionsQueryOptions(businessId));
