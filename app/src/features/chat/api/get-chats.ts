import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { chatKeys, QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export type ChatSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export const getChats = async (businessId: string): Promise<ChatSummary[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  return api.get<ChatSummary[]>(`/businesses/${businessId}/chats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getChatsQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: chatKeys.list(businessId),
    queryFn: () => getChats(businessId),
    enabled: Boolean(businessId),
  });

type UseGetChatsOptions = {
  queryConfig?: QueryConfig<typeof getChatsQueryOptions>;
};

export const useGetChats = (
  businessId: string,
  { queryConfig }: UseGetChatsOptions = {},
) =>
  useQuery({
    ...getChatsQueryOptions(businessId),
    ...queryConfig,
  });
