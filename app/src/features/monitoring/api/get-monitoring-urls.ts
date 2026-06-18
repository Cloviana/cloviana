import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type {
  MonitoringDomainsResponse,
  SourceOverviewParams,
  TopDomain,
} from './get-monitoring-domains';

export type MonitoringUrl = TopDomain;

export type MonitoringUrlsResponse = MonitoringDomainsResponse & {
  kind: 'urls';
};

export const getMonitoringUrls = async (
  businessId: string,
  params: SourceOverviewParams = {},
): Promise<MonitoringUrlsResponse> => {
  const headers = await getAuthHeaders();
  return api.get<MonitoringUrlsResponse>(
    `/businesses/${businessId}/monitoring/urls`,
    {
      headers,
      params,
    },
  );
};

export const useMonitoringUrls = (
  businessId: string,
  params: SourceOverviewParams = {},
) => {
  return useQuery({
    queryKey: ['monitoring', 'urls', businessId, params],
    queryFn: () => getMonitoringUrls(businessId, params),
    enabled: Boolean(businessId),
  });
};
