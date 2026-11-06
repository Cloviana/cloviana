'use client';

import type { AppendMessage, ThreadMessageLike } from '@assistant-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { paths } from '@/config/paths';

import { cancelRunAction } from '../actions/cancel-run';
import { getRunAction } from '../actions/get-run';
import { startRunAction } from '../actions/start-run';
import {
  activeRunQueryOptions,
  conversationsQueryOptions,
  editorKeys,
  messagesQueryOptions,
} from '../queries';

interface CodingStep {
  name: string;
  status: string;
}

/** What the agent has streamed so far; cleared once the saved message replaces it. */
interface LiveRun {
  id: string;
  text: string;
  codingText: Record<string, string>;
  steps: Record<string, CodingStep>;
}

const TERMINAL_EVENTS = ['run.succeeded', 'run.failed', 'run.cancelled'];
const TERMINAL_STATUSES = ['SUCCEEDED', 'FAILED', 'CANCELLED'];

function newLiveRun(id: string): LiveRun {
  return { id, text: '', codingText: {}, steps: {} };
}

function liveMessage(run: LiveRun): ThreadMessageLike {
  const coding = Object.values(run.codingText).join('\n\n');
  return {
    id: `live-${run.id}`,
    role: 'assistant',
    status: { type: 'running' },
    content: [
      ...Object.entries(run.steps).map(([id, step]) => ({
        type: 'tool-call' as const,
        toolCallId: id,
        toolName: step.name,
        args: {},
        ...(step.status === 'completed' || step.status === 'error'
          ? { result: step.status, isError: step.status === 'error' }
          : {}),
      })),
      { type: 'text' as const, text: run.text || coding },
    ],
  };
}

interface UseAgentThreadOptions {
  slug: string;
  themeId: string;
  onRevisionSaved: () => void;
}

export function useAgentThread({
  slug,
  themeId,
  onRevisionSaved,
}: UseAgentThreadOptions) {
  const queryClient = useQueryClient();
  const conversations = useQuery(conversationsQueryOptions(slug, themeId));
  const [createdId, setCreatedId] = useState<string | null>(null);
  const conversationId = conversations.data?.[0]?.id ?? createdId;

  const messages = useQuery({
    ...messagesQueryOptions(slug, themeId, conversationId ?? ''),
    enabled: !!conversationId,
  });
  const activeRun = useQuery({
    ...activeRunQueryOptions(slug, themeId, conversationId ?? ''),
    enabled: !!conversationId,
  });

  const [live, setLive] = useState<LiveRun | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const source = useRef<EventSource | null>(null);
  const onRevision = useRef(onRevisionSaved);
  useEffect(() => {
    onRevision.current = onRevisionSaved;
  }, [onRevisionSaved]);

  const finish = useCallback(
    async (runId: string, conversation: string) => {
      source.current?.close();
      source.current = null;
      const run = await getRunAction(slug, runId);
      if (run.status === 'FAILED') {
        setError(run.errorSummary ?? 'The agent stopped before finishing.');
      }
      await queryClient.invalidateQueries({
        queryKey: editorKeys.messages(slug, themeId, conversation),
      });
      await queryClient.invalidateQueries({
        queryKey: editorKeys.conversations(slug, themeId),
      });
      setPendingPrompt(null);
      setLive(null);
      onRevision.current();
    },
    [queryClient, slug, themeId],
  );

  const follow = useCallback(
    (runId: string, conversation: string) => {
      source.current?.close();
      setLive(newLiveRun(runId));
      const events = new EventSource(
        `${paths.mp.themes.editor.getHref(slug, themeId)}/runs/${encodeURIComponent(runId)}/stream`,
      );
      source.current = events;

      const on = <T>(type: string, apply: (payload: T) => void) => {
        events.addEventListener(type, (event) =>
          apply(JSON.parse((event as MessageEvent<string>).data) as T),
        );
      };
      const update = (change: (run: LiveRun) => LiveRun) =>
        setLive((run) => (run?.id === runId ? change(run) : run));

      on<{ text: string }>('assistant.delta', ({ text }) =>
        update((run) => ({ ...run, text: run.text + text })),
      );
      on<{ partId: string; text: string }>('coding.text', ({ partId, text }) =>
        update((run) => ({
          ...run,
          codingText: { ...run.codingText, [partId]: text },
        })),
      );
      on<CodingStep & { partId: string }>(
        'coding.tool',
        ({ partId, name, status }) =>
          update((run) => ({
            ...run,
            steps: { ...run.steps, [partId]: { name, status } },
          })),
      );
      on('revision.saved', () => onRevision.current());
      for (const type of TERMINAL_EVENTS) {
        events.addEventListener(type, () => void finish(runId, conversation));
      }
      // The browser reconnects by itself (Last-Event-ID resumes the replay), but a stream that
      // ended before this page saw a terminal event would otherwise retry forever.
      events.onerror = () => {
        void getRunAction(slug, runId).then((run) => {
          if (TERMINAL_STATUSES.includes(run.status)) {
            void finish(runId, conversation);
          }
        });
      };
    },
    [finish, slug, themeId],
  );

  useEffect(() => () => source.current?.close(), []);

  // A reload during a run picks the stream back up from the start of the replay.
  const run = activeRun.data?.run;
  useEffect(() => {
    if (run && conversationId && !source.current) {
      follow(run.id, run.conversationId);
    }
  }, [conversationId, follow, run]);

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const prompt = message.content
        .flatMap((part) => (part.type === 'text' ? [part.text] : []))
        .join('\n')
        .trim();
      if (!prompt) return;

      setError(null);
      setPendingPrompt(prompt);
      setStarting(true);
      const result = await startRunAction(slug, themeId, {
        conversationId,
        prompt,
        idempotencyKey: crypto.randomUUID(),
      });
      setStarting(false);
      if (!result.success) {
        setPendingPrompt(null);
        setError(result.message);
        return;
      }
      setCreatedId(result.run.conversationId);
      await queryClient.invalidateQueries({
        queryKey: editorKeys.messages(slug, themeId, result.run.conversationId),
      });
      setPendingPrompt(null);
      follow(result.run.id, result.run.conversationId);
    },
    [conversationId, follow, queryClient, slug, themeId],
  );

  const onCancel = useCallback(async () => {
    if (live) await cancelRunAction(slug, live.id);
  }, [live, slug]);

  const threadMessages = useMemo(() => {
    const saved: ThreadMessageLike[] = (messages.data ?? []).flatMap(
      (message) =>
        message.role === 'USER' || message.role === 'ASSISTANT'
          ? [
              {
                id: message.id,
                role: message.role === 'USER' ? 'user' : 'assistant',
                content: message.content?.text ?? '',
                createdAt: new Date(message.createdAt),
              } as const,
            ]
          : [],
    );
    return [
      ...saved,
      ...(pendingPrompt
        ? [{ id: 'pending', role: 'user', content: pendingPrompt } as const]
        : []),
      ...(live ? [liveMessage(live)] : []),
    ];
  }, [live, messages.data, pendingPrompt]);

  return {
    messages: threadMessages,
    isRunning: starting || !!live,
    isLoading:
      conversations.isPending || (!!conversationId && messages.isPending),
    error,
    onNew,
    onCancel,
  };
}
