import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export type ChatMessagePart = {
  type?: string;
  text?: string;
};

export type ChatMessage = {
  role?: string;
  content?: readonly ChatMessagePart[];
};

export type SendMessageRequest = {
  chatId?: string;
  messages: readonly ChatMessage[];
};

export type SendMessageResponse = {
  chatId: string;
  title: string;
  content: { type: 'text'; text: string }[];
};

export const sendMessage = async (
  businessId: string,
  body: SendMessageRequest,
  signal?: AbortSignal,
): Promise<SendMessageResponse> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  return api.post<SendMessageResponse>(`/businesses/${businessId}/chat`, body, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
};
