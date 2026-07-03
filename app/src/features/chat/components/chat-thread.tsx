'use client';

import {
  AssistantRuntimeProvider,
  type ChatModelAdapter,
  type ThreadMessageLike,
  useLocalRuntime,
} from '@assistant-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import { Thread } from '@/components/assistant-ui/thread';
import { paths } from '@/config/paths';
import { getChatMessagesQueryOptions } from '@/features/chat/api/get-chat-messages';
import { sendMessageStream } from '@/features/chat/api/send-message';
import { chatAttachmentAdapter } from '@/features/chat/lib/attachment-adapter';
import { chatKeys } from '@/lib/react-query';

const CHAT_NOT_FOUND_MESSAGE =
  "You don't have access to this conversation. Make sure you're logged in to the right account, or ask the conversation owner to send you a share link.";

type ChatThreadProps = {
  businessId: string;
  chatId?: string;
  navigateOnNewChat?: boolean;
  onChatCreated?: (chatId: string) => void;
};

export function ChatThread({
  businessId,
  chatId,
  navigateOnNewChat = true,
  onChatCreated,
}: ChatThreadProps) {
  if (!chatId) {
    return (
      <ChatThreadRuntime
        businessId={businessId}
        navigateOnNewChat={navigateOnNewChat}
        onChatCreated={onChatCreated}
      />
    );
  }

  return <ChatThreadWithHistory businessId={businessId} chatId={chatId} />;
}

type ChatThreadWithHistoryProps = {
  businessId: string;
  chatId: string;
};

// Waits until chat history has either loaded or failed before mounting the
// runtime below, so useLocalRuntime's `initialMessages` (only read on its
// very first render) is never captured as empty due to a pending fetch.
function ChatThreadWithHistory({
  businessId,
  chatId,
}: ChatThreadWithHistoryProps) {
  const router = useRouter();
  const { data, error, isPending } = useQuery(
    getChatMessagesQueryOptions(businessId, chatId),
  );
  const notFound = isAxiosError(error) && error.response?.status === 404;

  useEffect(() => {
    if (!notFound) return;
    toast.warning(CHAT_NOT_FOUND_MESSAGE, {
      style: { '--width': '28rem' } as React.CSSProperties,
    });
    router.replace(paths.business.chat.getHref(businessId));
  }, [notFound, router, businessId]);

  const initialMessages = useMemo<ThreadMessageLike[] | undefined>(
    () =>
      data?.messages.map(
        (message): ThreadMessageLike => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: new Date(message.createdAt),
        }),
      ),
    [data],
  );

  if (isPending || error) return null;

  return (
    <ChatThreadRuntime
      businessId={businessId}
      chatId={chatId}
      initialMessages={initialMessages}
    />
  );
}

type ChatThreadRuntimeProps = {
  businessId: string;
  chatId?: string;
  initialMessages?: ThreadMessageLike[];
  navigateOnNewChat?: boolean;
  onChatCreated?: (chatId: string) => void;
};

function ChatThreadRuntime({
  businessId,
  chatId,
  initialMessages,
  navigateOnNewChat = true,
  onChatCreated,
}: ChatThreadRuntimeProps) {
  const router = useRouter();
  const chatIdRef = useRef(chatId);
  const queryClient = useQueryClient();
  const adapter = useMemo<ChatModelAdapter>(
    () => ({
      async *run({ messages, abortSignal }) {
        const isNewChat = !chatIdRef.current;
        // Claude-web style activity: narration text before a tool call folds
        // into a collapsible "reasoning" block, tool calls render as chips
        // that spin until the next event proves the tool finished.
        const parts: (
          | { type: 'reasoning'; text: string }
          | {
              type: 'tool-call';
              toolCallId: string;
              toolName: string;
              args: Record<string, never>;
              argsText: string;
              result?: string;
            }
        )[] = [];
        let text = '';
        const settleTools = () => {
          for (const part of parts) {
            if (part.type === 'tool-call' && part.result === undefined) {
              part.result = 'Done';
            }
          }
        };
        const content = () => [
          ...parts,
          ...(text ? [{ type: 'text' as const, text }] : []),
        ];

        for await (const event of sendMessageStream(
          businessId,
          { chatId: chatIdRef.current, messages },
          abortSignal,
        )) {
          if (event.type === 'delta') {
            settleTools();
            text += event.text;
            yield { content: content() };
          } else if (event.type === 'action') {
            settleTools();
            if (text) {
              parts.push({ type: 'reasoning' as const, text });
              text = '';
            }
            parts.push({
              type: 'tool-call' as const,
              toolCallId: `action_${parts.length}`,
              toolName: event.label,
              args: {},
              argsText: '',
            });
            yield { content: content() };
          } else if (event.type === 'done') {
            settleTools();
            const { response } = event;
            chatIdRef.current = response.chatId;

            queryClient.invalidateQueries({
              queryKey: chatKeys.list(businessId),
            });
            queryClient.invalidateQueries({
              queryKey: chatKeys.detail(businessId, response.chatId),
            });

            // Keep the activity trail visible; the server's text is
            // canonical for the final answer.
            yield { content: [...parts, ...response.content] };

            // Navigate after the stream so the remount doesn't cut it short.
            if (isNewChat) {
              onChatCreated?.(response.chatId);

              if (navigateOnNewChat) {
                router.replace(
                  paths.business.chat.detail.getHref(
                    businessId,
                    response.chatId,
                  ),
                );
              }
            }
          }
        }
      },
    }),
    [businessId, queryClient, router, navigateOnNewChat, onChatCreated],
  );
  const runtime = useLocalRuntime(adapter, {
    adapters: { attachments: chatAttachmentAdapter },
    initialMessages,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
}
