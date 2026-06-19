import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

export type GapBreakdown = {
  name: string;
  domain: string;
  isSelf: boolean;
  mentionRate: number;
  citationShare: number;
  sov: number;
};

export type MonitoringGapResponse = {
  trend: Record<string, any>[];
  breakdown: GapBreakdown[];
};

export const getMonitoringGap = async (
  businessId: string,
): Promise<MonitoringGapResponse> => {
  const headers = await getAuthHeaders();
  return api.get<MonitoringGapResponse>(
    `/businesses/${businessId}/monitoring/gap`,
    { headers },
  );
};

export const useMonitoringGap = (businessId: string) => {
  return useQuery({
    queryKey: ['monitoring', 'gap', businessId],
    queryFn: () => getMonitoringGap(businessId),
  });
};
