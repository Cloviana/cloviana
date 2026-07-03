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
  CheckIcon,
  ChevronDownIcon,
  FileTextIcon,
  LoaderIcon,
  XCircleIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Thread, type ThreadComponents } from '@/components/assistant-ui/thread';
import { paths } from '@/config/paths';
import { useGetBusiness } from '@/features/businesses/api/get-business';
import { getChatMessagesQueryOptions } from '@/features/chat/api/get-chat-messages';
import {
  sendMessageStream,
  type ActionResultItem,
} from '@/features/chat/api/send-message';
import { chatAttachmentAdapter } from '@/features/chat/lib/attachment-adapter';
import { chatKeys } from '@/lib/react-query';
import { cn } from '@/utils/cn';

type ToolCardResult = {
  count?: number;
  results?: ActionResultItem[];
  error?: boolean;
};

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
        // eslint-disable-next-line @next/next/no-img-element
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

// Shimmering activity line used for the pre-request "Thinking" placeholder.
const ThinkingLine = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 py-1 text-[13px] text-stone-500">
    <LoaderIcon className="size-3.5 shrink-0 animate-spin [animation-duration:0.6s]" />
    <span className="relative inline-block leading-snug">
      {label}
      <span
        aria-hidden
        className="shimmer pointer-events-none absolute inset-0 motion-reduce:animate-none"
      >
        {label}
      </span>
    </span>
  </div>
);

// Tool activity card: header shows the action + query and the result count;
// the body lists each retrieved source. Open by default so results are
// visible while they load — never hidden behind a click.
const ToolCard: ToolCallMessagePartComponent = ({
  toolName,
  args,
  result,
  status,
}) => {
  const [open, setOpen] = useState(true);

  if (toolName === 'Thinking') return <ThinkingLine label="Thinking" />;

  const running = status?.type === 'running' && result === undefined;
  const res =
    result && typeof result === 'object' ? (result as ToolCardResult) : null;
  const items = res?.results ?? [];
  const count = res?.count ?? items.length;
  const failed = res?.error === true;
  const detail =
    typeof (args as { detail?: unknown })?.detail === 'string'
      ? ((args as { detail?: string }).detail ?? '')
      : '';
  const hasBody = running || items.length > 0;

  // Styled after the landing page's AI search-result card (web/hero):
  // white/90 surface, stone-200/70 border, subtle inset shadow.
  return (
    <div className="my-2 w-full overflow-hidden rounded-xl border border-stone-200/70 bg-white/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={!hasBody}
        className={cn(
          'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start',
          hasBody && open && 'border-b border-stone-200/70',
        )}
      >
        {running ? (
          <LoaderIcon className="size-3.5 shrink-0 animate-spin text-stone-400 [animation-duration:0.6s]" />
        ) : failed ? (
          <XCircleIcon className="text-destructive size-3.5 shrink-0" />
        ) : (
          <CheckIcon className="size-3.5 shrink-0 text-stone-400" />
        )}
        <span className="relative min-w-0 flex-1 truncate text-[13px] leading-snug">
          <span className="text-stone-600">{toolName}</span>
          {detail && (
            <span className="text-stone-400">
              {' '}
              &middot; &ldquo;{detail}&rdquo;
            </span>
          )}
          {running && (
            <span
              aria-hidden
              className="shimmer pointer-events-none absolute inset-0 truncate motion-reduce:animate-none"
            >
              <span>{toolName}</span>
              {detail && (
                <span>
                  {' '}
                  &middot; &ldquo;{detail}&rdquo;
                </span>
              )}
            </span>
          )}
        </span>
        {!running && count > 0 && (
          <span className="shrink-0 text-[11px] font-medium tracking-[0.02em] text-stone-400 tabular-nums">
            {count} result{count === 1 ? '' : 's'}
          </span>
        )}
        {hasBody && (
          <ChevronDownIcon
            className={cn(
              'size-3.5 shrink-0 text-stone-400 transition-transform duration-200',
              !open && '-rotate-90',
            )}
          />
        )}
      </button>
      {hasBody && open && (
        <div className="flex flex-col px-1.5 py-1.5">
          {items.length > 0 ? (
            items.map((item, index) => <ResultRow key={index} item={item} />)
          ) : (
            <div className="flex flex-col gap-1.5 px-2 py-1.5">
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-stone-200/60" />
              <div className="h-3.5 w-1/2 animate-pulse rounded bg-stone-200/60" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const threadComponents: Omit<ThreadComponents, 'Welcome'> = {
  ToolFallback: ToolCard,
  // Consecutive tool cards stack as a plain list — no "N tool calls" header.
  ToolGroup: ({ children }) => <div className="flex flex-col">{children}</div>,
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
  const { data: business } = useGetBusiness(businessId);
  const businessName = business?.name;
  const components = useMemo<ThreadComponents>(() => {
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    // Hero-style welcome: Gambarino serif heading, muted Switzer subtitle —
    // same treatment as the landing page hero.
    const Welcome = () => (
      <div className="aui-thread-welcome-root mb-8 flex flex-col items-center px-4 text-center">
        <h1 className="aui-thread-welcome-message-inner font-gambarino fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-4xl font-normal duration-300 md:text-5xl">
          {greeting}.
        </h1>
        <p className="text-foreground-light fade-in slide-in-from-bottom-1 animate-in fill-mode-both mt-3 max-w-[45ch] text-sm duration-300 md:text-base">
          {businessName
            ? `What can I do for ${businessName} today?`
            : 'What can I do for you today?'}
        </p>
      </div>
    );
    return { ...threadComponents, Welcome };
  }, [businessName]);
  const adapter = useMemo<ChatModelAdapter>(
    () => ({
      async *run({ messages, abortSignal }) {
        const isNewChat = !chatIdRef.current;
        // Claude-web style activity: narration sentences render as plain
        // text parts, each tool call renders as a card that fills with its
        // result list when the tool finishes. Raw reasoning never surfaces.
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

        // Show a live "Thinking" line immediately instead of dead air while
        // the request is prepared; the first real event replaces it.
        yield {
          content: [
            ...content(),
            {
              type: 'tool-call' as const,
              toolCallId: 'thinking',
              toolName: 'Thinking',
              args: {},
              argsText: '',
            },
          ],
        };

        for await (const event of sendMessageStream(
          businessId,
          { chatId: chatIdRef.current, messages },
          abortSignal,
        )) {
          if (event.type === 'delta') {
            text += event.text;
            yield { content: content() };
          } else if (event.type === 'reasoning') {
            // Model thoughts stream into a collapsible "Thinking" block that
            // stays in the transcript, Claude-web style.
            flushText();
            const last = parts[parts.length - 1];
            if (last && last.type === 'reasoning') {
              last.text += event.text;
            } else {
              parts.push({ type: 'reasoning', text: event.text });
            }
            yield { content: content() };
          } else if (event.type === 'action') {
            // The narration sentence streamed before this call stays a
            // visible text part of its own.
            flushText();
            parts.push({
              type: 'tool-call' as const,
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
            for (const part of parts) {
              if (part.type === 'tool-call' && part.result === undefined) {
                part.result = { count: 0, results: [] };
              }
            }
            const { response } = event;
            chatIdRef.current = response.chatId;

            queryClient.invalidateQueries({
              queryKey: chatKeys.list(businessId),
            });
            queryClient.invalidateQueries({
              queryKey: chatKeys.detail(businessId, response.chatId),
            });

            // The server persists and returns the full part list
            // (thinking + tool cards + text); it is canonical so the
            // transcript looks identical after a reload.
            yield { content: response.content };

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
      <Thread components={components} />
    </AssistantRuntimeProvider>
  );
}
