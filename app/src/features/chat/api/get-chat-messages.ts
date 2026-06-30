import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { chatKeys, QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export type ChatMessageRole = 'user' | 'assistant';

export type ChatHistoryMessagePart = {
  type: 'text';
  text: string;
};

export type ChatHistoryMessage = {
  id: string;
  role: ChatMessageRole;
  content: ChatHistoryMessagePart[];
  createdAt: string;
};

export type ChatHistoryResponse = {
  id: string;
  title: string;
  messages: ChatHistoryMessage[];
};

export const getChatMessages = async (
  businessId: string,
  chatId: string,
): Promise<ChatHistoryResponse> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  return api.get<ChatHistoryResponse>(
    `/businesses/${businessId}/chats/${chatId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

export const getChatMessagesQueryOptions = (
  businessId: string,
  chatId: string,
) =>
  queryOptions({
    queryKey: chatKeys.detail(businessId, chatId),
    queryFn: () => getChatMessages(businessId, chatId),
    enabled: Boolean(businessId) && Boolean(chatId),
  });

type UseGetChatMessagesOptions = {
  queryConfig?: QueryConfig<typeof getChatMessagesQueryOptions>;
};

export const useGetChatMessages = (
  businessId: string,
  chatId: string,
  { queryConfig }: UseGetChatMessagesOptions = {},
) =>
  useQuery({
    ...getChatMessagesQueryOptions(businessId, chatId),
    ...queryConfig,
  });
