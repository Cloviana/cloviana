import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import type {
  ChatHistoryMessage,
  ChatHistoryResponse,
} from '@/features/chat/api/get-chat-messages';
import type { ChatSummary } from '@/features/chat/api/get-chats';
import type {
  ChatMessage,
  SendMessageRequest,
  SendMessageResponse,
} from '@/features/chat/api/send-message';

const TITLE_MAX_LENGTH = 40;

type StoredChat = ChatSummary & {
  businessId: string;
};

const chats: StoredChat[] = [];
const messagesByChatId = new Map<string, ChatHistoryMessage[]>();

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function now() {
  return new Date().toISOString();
}

function getLastUserMessage(messages: readonly ChatMessage[] = []) {
  const lastUserMessage = messages.findLast(
    (message) => message.role === 'user',
  );

  return (
    lastUserMessage?.content
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
      .trim() || 'your message'
  );
}

function getFirstUserMessage(messages: readonly ChatMessage[] = []) {
  const firstUserMessage = messages.find((message) => message.role === 'user');

  return (
    firstUserMessage?.content
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
      .trim() || 'New chat'
  );
}

function deriveTitle(text: string) {
  if (text.length <= TITLE_MAX_LENGTH) return text;
  return `${text.slice(0, TITLE_MAX_LENGTH).trimEnd()}...`;
}

function toHistoryMessage(message: ChatMessage): ChatHistoryMessage {
  return {
    id: makeId(),
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: (message.content ?? [])
      .filter((part) => part.type === 'text' && part.text)
      .map((part) => ({ type: 'text' as const, text: part.text ?? '' })),
    createdAt: now(),
  };
}

export const chatHandlers = [
  http.post(
    `${env.API_URL}/businesses/:businessId/chat`,
    async ({ params, request }) => {
      const businessId = params.businessId as string;
      const body = (await request.json()) as SendMessageRequest;
      const message = getLastUserMessage(body.messages);
      const chatId = body.chatId ?? makeId();
      const title = deriveTitle(getFirstUserMessage(body.messages));

      const existingChat = chats.find((chat) => chat.id === chatId);
      if (existingChat) {
        existingChat.updatedAt = now();
      } else {
        chats.push({
          id: chatId,
          businessId,
          title,
          createdAt: now(),
          updatedAt: now(),
        });
      }

      const replyText = `Mock response for chat ${chatId}: I received "${message}".`;

      messagesByChatId.set(chatId, [
        ...body.messages.map(toHistoryMessage),
        toHistoryMessage({
          role: 'assistant',
          content: [{ type: 'text', text: replyText }],
        }),
      ]);

      const response: SendMessageResponse = {
        chatId,
        title,
        content: [{ type: 'text', text: replyText }],
      };

      return HttpResponse.json(response);
    },
  ),

  http.get(`${env.API_URL}/businesses/:businessId/chats`, ({ params }) => {
    const response: ChatSummary[] = chats
      .filter((chat) => chat.businessId === params.businessId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(({ id, title, createdAt, updatedAt }) => ({
        id,
        title,
        createdAt,
        updatedAt,
      }));

    return HttpResponse.json(response);
  }),

  http.get(
    `${env.API_URL}/businesses/:businessId/chats/:chatId`,
    ({ params }) => {
      const chat = chats.find((c) => c.id === params.chatId);
      if (!chat)
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });

      const response: ChatHistoryResponse = {
        id: chat.id,
        title: chat.title,
        messages: messagesByChatId.get(chat.id) ?? [],
      };

      return HttpResponse.json(response);
    },
  ),
];
