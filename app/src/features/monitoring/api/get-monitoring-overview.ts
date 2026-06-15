import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { MonitoringOverview } from '../types';

export async function getMonitoringOverview(businessId: string) {
  const headers = await getAuthHeaders();
  return api.get<MonitoringOverview>(
    `/businesses/${businessId}/monitoring/overview`,
    { headers },
  );
}

export const getMonitoringOverviewQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: ['businesses', businessId, 'monitoring-overview'],
    queryFn: () => getMonitoringOverview(businessId),
    enabled: Boolean(businessId),
    refetchInterval: (query) => {
      const status = query.state.data?.latestRun?.status;
      return status === 'PENDING' || status === 'RUNNING' ? 5000 : false;
    },
  });

export function useMonitoringOverview(businessId: string) {
  return useQuery(getMonitoringOverviewQueryOptions(businessId));
}
