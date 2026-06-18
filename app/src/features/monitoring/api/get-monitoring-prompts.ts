import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { MonitoringPromptResponse } from '../types';

export const getMonitoringPrompts = async (
  businessId: string,
): Promise<MonitoringPromptResponse> => {
  const headers = await getAuthHeaders();
  return api.get<MonitoringPromptResponse>(
    `/businesses/${businessId}/monitoring/prompts`,
    { headers },
  );
};

export const useMonitoringPrompts = (businessId: string) => {
  return useQuery({
    queryKey: ['monitoring', 'prompts', businessId],
    queryFn: () => getMonitoringPrompts(businessId),
    enabled: Boolean(businessId),
  });
};
