import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { AiEngine, PaginatedResponse } from '../types';

export type MonitoringChat = {
  id: string;
  promptId: string;
  promptText: string;
  engine: AiEngine;
  text: string;
  createdAt: string;
  citationsCount: number;
  mentionsCount: number;
};

export type MonitoringChatsParams = {
  engine?: AiEngine | 'ALL';
  page?: number;
  limit?: number;
  search?: string;
  topicId?: string;
};

export const getMonitoringChats = async (
  businessId: string,
  params: MonitoringChatsParams = {},
): Promise<PaginatedResponse<MonitoringChat>> => {
  const headers = await getAuthHeaders();
  return api.get<PaginatedResponse<MonitoringChat>>(
    `/businesses/${businessId}/monitoring/chats`,
    { headers, params },
  );
};

export const useMonitoringChats = (
  businessId: string,
  params: MonitoringChatsParams = {},
) => {
  return useQuery({
    queryKey: ['monitoring', 'chats', businessId, params],
    queryFn: () => getMonitoringChats(businessId, params),
    enabled: Boolean(businessId),
  });
};
