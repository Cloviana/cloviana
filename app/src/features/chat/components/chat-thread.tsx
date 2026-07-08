'use client';

import {
  AssistantRuntimeProvider,
  type ChatModelAdapter,
  type ThreadMessageLike,
  type ToolCallMessagePartComponent,
  useLocalRuntime,
} from '@assistant-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  BookOpenIcon,
  ClockFadingIcon,
  FileTextIcon,
  GlobeIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, type PropsWithChildren } from 'react';
import { toast } from 'sonner';

import {
  Thread,
  type ThreadComponents,
} from '@/components/assistant-ui/thread';
import { paths } from '@/config/paths';
import { getChatMessagesQueryOptions } from '@/features/chat/api/get-chat-messages';
import {
  sendMessageStream,
  type ActionResultItem,
} from '@/features/chat/api/send-message';
import { chatKeys } from '@/lib/react-query';
import { cn } from '@/utils/cn';

type ToolCardResult = {
  count?: number;
  results?: ActionResultItem[];
  error?: boolean;
};

// Small bullet that sits on top of the chain-of-thought's dashed timeline
// line (see thread.tsx's "group-chainOfThought" case). The whole h-6 box
// (matching the row text's leading-6, so the dot centers on the first
// line rather than the whole block) is the mask — not just a snug circle
// around the icon — so the dash visibly stops short with a gap above and
// below the icon instead of running right up against it.
const TimelineDot = ({ children }: PropsWithChildren) => (
  <span className="bg-background relative z-10 flex h-6 w-4 shrink-0 items-center justify-center">
    {children}
  </span>
);

const faviconUrl = (item: ActionResultItem) => {
  const domain = item.source || (item.url ? safeHostname(item.url) : null);
  if (!domain || !item.url) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
};

function safeHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const ResultRow = ({ item }: { item: ActionResultItem }) => {
  const favicon = faviconUrl(item);
  const row = (
    <div className="flex min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5">
      {favicon ? (
        <img
          src={favicon}
          alt=""
          className="size-3.5 shrink-0 rounded-[3px] opacity-70"
        />
      ) : (
        <FileTextIcon className="size-3.5 shrink-0 text-stone-400" />
      )}
      <span className="min-w-0 flex-1 truncate text-[13px] leading-6 font-normal text-stone-500">
        {item.title || item.source || 'Untitled'}
      </span>
      {item.source && (
        <span className="max-w-[10rem] shrink-0 truncate text-[11px] font-medium text-stone-400">
          {item.source}
        </span>
      )}
    </div>
  );
  if (item.url) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="block rounded-md transition-colors hover:bg-stone-100/70"
      >
        {row}
      </a>
    );
  }
  return row;
};

// Plain, always-visible reasoning line — no accordion, rides the shared
// dashed timeline drawn by thread.tsx's "group-chainOfThought" wrapper.
const TimelineReasoningGroup: NonNullable<
  ThreadComponents['ReasoningGroup']
> = ({ children, group }) => {
  const running = group.status.type === 'running';
  return (
    <div className="relative flex items-start gap-3 py-1">
      <TimelineDot>
        <ClockFadingIcon
          className={cn('size-3.5 text-stone-400', running && 'animate-pulse')}
        />
      </TimelineDot>
      <div className="min-w-0 flex-1 text-[13px] leading-6 text-stone-500 italic">
        {children}
      </div>
    </div>
  );
};

// Flat wrapper — no "N tool calls" accordion. Each tool-call part below
// already renders its own full timeline row via TimelineToolFallback.
const TimelineToolGroup: NonNullable<ThreadComponents['ToolGroup']> = ({
  children,
}) => <>{children}</>;

// Web-search/knowledge-base-style tool call: a timeline row with the query
// + result count, and (once results arrive) an inline card of result rows
// directly below.
const TimelineToolFallback: ToolCallMessagePartComponent = ({
  toolName,
  args,
  result,
  status,
}) => {
  const running = status?.type === 'running' && result === undefined;
  const res =
    result && typeof result === 'object' ? (result as ToolCardResult) : null;
  const items = res?.results ?? [];
  const count = res?.count;
  const label =
    typeof (args as { detail?: unknown })?.detail === 'string' &&
    (args as { detail?: string }).detail
      ? (args as { detail: string }).detail
      : toolName;
  const tool = (args as { tool?: string })?.tool;
  const isFileTool = tool === 'read_file';
  const Icon =
    tool === 'query_knowledge_base'
      ? BookOpenIcon
      : isFileTool
        ? FileTextIcon
        : GlobeIcon;

  return (
    <div className="relative flex flex-col gap-2 py-1">
      <div className="flex items-center gap-3">
        <TimelineDot>
          <Icon
            className={cn(
              'size-3.5 text-stone-400',
              running && 'animate-pulse',
            )}
          />
        </TimelineDot>
        <span className="min-w-0 flex-1 truncate text-[13px] leading-6 text-stone-600">
          {label}
        </span>
        {!running && !isFileTool && count !== undefined && (
          <span className="shrink-0 text-[12px] text-stone-400 tabular-nums">
            {count} result{count === 1 ? '' : 's'}
          </span>
        )}
      </div>
      {items.length > 0 && (
        <div className="ms-7 overflow-hidden rounded-xl border border-stone-200/70 bg-white/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md">
          {items.map((item, index) => (
            <ResultRow key={item.url ?? index} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

const timelineComponents: Pick<
  ThreadComponents,
  'ToolFallback' | 'ToolGroup' | 'ReasoningGroup'
> = {
  ToolFallback: TimelineToolFallback,
  ToolGroup: TimelineToolGroup,
  ReasoningGroup: TimelineReasoningGroup,
};

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

<<<<<<< HEAD
  // key remounts the runtime when the user switches chats, so chatIdRef and
  // useLocalRuntime's captured initialMessages never go stale.
  return (
    <ChatThreadWithHistory key={chatId} businessId={businessId} chatId={chatId} />
  );
=======
  return <ChatThreadWithHistory businessId={businessId} chatId={chatId} />;
>>>>>>> b9092495db5dd80d333a525a2c701471261db8e2
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

type StreamPart =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string }
  | {
      type: 'tool-call';
      toolCallId: string;
      toolName: string;
      args: { detail?: string; tool?: string };
      argsText: string;
      result?: ToolCardResult;
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
        // Mirrors the backend's own part assembly so the live view matches
        // what gets persisted: reasoning and tool calls build up in place as
        // events arrive, instead of only appearing once `done` dumps the
        // canonical content in one shot.
        const parts: StreamPart[] = [];
        let text = '';
        const flushText = () => {
          if (text.trim()) parts.push({ type: 'text', text });
          text = '';
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
            text += event.text;
            yield { content: content() };
          } else if (event.type === 'reasoning') {
            flushText();
            const last = parts[parts.length - 1];
            if (last && last.type === 'reasoning') {
              last.text += event.text;
            } else {
              parts.push({ type: 'reasoning', text: event.text });
            }
            yield { content: content() };
          } else if (event.type === 'action') {
            flushText();
            parts.push({
              type: 'tool-call',
              toolCallId: event.id,
              toolName: event.label,
              args: { detail: event.detail, tool: event.tool },
              argsText: '',
            });
            yield { content: content() };
          } else if (event.type === 'action-result') {
            const part = parts.find(
              (p) => p.type === 'tool-call' && p.toolCallId === event.id,
            );
            if (part && part.type === 'tool-call') {
              part.result = {
                count: event.count,
                results: event.results,
                error: event.error,
              };
            }
            yield { content: content() };
          } else if (event.type === 'done') {
            const { response } = event;
            chatIdRef.current = response.chatId;

            queryClient.invalidateQueries({
              queryKey: chatKeys.list(businessId),
            });
            queryClient.invalidateQueries({
              queryKey: chatKeys.detail(businessId, response.chatId),
            });

            // The server persists and returns the full canonical part list;
            // it replaces our locally-built one so a reload looks identical.
            yield { content: response.content };

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
  const runtime = useLocalRuntime(adapter, { initialMessages });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread components={timelineComponents} />
    </AssistantRuntimeProvider>
  );
}
