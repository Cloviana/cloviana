import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

export type MonitoringChat = {
  id: string;
  promptId: string;
  promptText: string;
  engine: 'CLAUDE' | 'CHATGPT' | 'PERPLEXITY' | 'AI_OVERVIEWS';
  text: string;
  createdAt: string;
  citationsCount: number;
  mentionsCount: number;
};

export const getMonitoringChats = async (
  businessId: string,
): Promise<MonitoringChat[]> => {
  const headers = await getAuthHeaders();
  return api.get<MonitoringChat[]>(
    `/businesses/${businessId}/monitoring/chats`,
    { headers },
  );
};

export const useMonitoringChats = (businessId: string) => {
  return useQuery({
    queryKey: ['monitoring', 'chats', businessId],
    queryFn: () => getMonitoringChats(businessId),
  });
};
