import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

export type MonitoringUrl = {
  url: string;
  domain: string;
  count: number;
  title: string | null;
};

export const getMonitoringUrls = async (
  businessId: string,
): Promise<MonitoringUrl[]> => {
  const headers = await getAuthHeaders();
  return api.get<MonitoringUrl[]>(`/businesses/${businessId}/monitoring/urls`, {
    headers,
  });
};

export const useMonitoringUrls = (businessId: string) => {
  return useQuery({
    queryKey: ['monitoring', 'urls', businessId],
    queryFn: () => getMonitoringUrls(businessId),
  });
};
