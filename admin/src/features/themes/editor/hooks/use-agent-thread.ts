'use client';

import type { AppendMessage } from '@assistant-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { paths } from '@/config/paths';

import { cancelRunAction } from '../actions/cancel-run';
import { getRunAction } from '../actions/get-run';
import { startRunAction } from '../actions/start-run';
import { applyPartEvent } from '../chat/model/apply-part-event';
import { latestTodos } from '../chat/model/latest-todos';
import {
  dequeue,
  enqueue,
  removeQueued,
  takeBack,
  type QueuedMessage,
} from '../chat/model/message-queue';
import { APPROVE_PLAN_PROMPT, DEFAULT_MODE } from '../chat/model/mode';
import {
  PART_DELTA_EVENT,
  PART_UPSERT_EVENT,
  parsePartEvent,
  type Part,
} from '../chat/model/part';
import { userPromptsOf } from '../chat/model/prompt-history';
import type { RunContext } from '../chat/model/run-context';
import {
  assistantMessage,
  toThreadMessage,
} from '../chat/model/to-thread-message';
import {
  activeRunQueryOptions,
  conversationsQueryOptions,
  editorKeys,
  messagesQueryOptions,
} from '../queries';
import type { AgentMode } from '../types';

/** What the agent has produced so far; cleared once the saved message replaces it. */
interface LiveRun {
  id: string;
  parts: readonly Part[];
}

const TERMINAL_EVENTS = ['run.succeeded', 'run.failed', 'run.cancelled'];
const TERMINAL_STATUSES = ['SUCCEEDED', 'FAILED', 'CANCELLED'];

interface UseAgentThreadOptions {
  slug: string;
  themeId: string;
  onRevisionSaved: () => void;
  /** What the user is looking at, read when a message is sent. */
  getContext: () => RunContext | undefined;
  /** Called once a message has been sent, so one-time context can be cleared. */
  onSent: () => void;
}

export function useAgentThread({
  slug,
  themeId,
  onRevisionSaved,
  getContext,
  onSent,
}: UseAgentThreadOptions) {
  const queryClient = useQueryClient();
  const conversations = useQuery(conversationsQueryOptions(slug, themeId));
  /** A conversation picked or just started, 'new' for one not created yet, or null for the latest. */
  const [chosen, setChosen] = useState<string | 'new' | null>(null);
  const conversationId =
    chosen === 'new' ? null : (chosen ?? conversations.data?.[0]?.id ?? null);

  const messages = useQuery({
    ...messagesQueryOptions(slug, themeId, conversationId ?? ''),
    enabled: !!conversationId,
  });
  const activeRun = useQuery({
    ...activeRunQueryOptions(slug, themeId, conversationId ?? ''),
    enabled: !!conversationId,
  });

  const [mode, setMode] = useState<AgentMode>(DEFAULT_MODE);
  const [live, setLive] = useState<LiveRun | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Messages typed while the agent was busy. They go out one at a time once it is free. */
  const [queued, setQueued] = useState<readonly QueuedMessage[]>([]);
  /** Set after a failed send, so the queue waits for the user instead of retrying in a loop. */
  const [paused, setPaused] = useState(false);
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
      setLive({ id: runId, parts: [] });
      const events = new EventSource(
        `${paths.mp.themes.editor.getHref(slug, themeId)}/runs/${encodeURIComponent(runId)}/stream`,
      );
      source.current = events;

      const update = (change: (run: LiveRun) => LiveRun) =>
        setLive((run) => (run?.id === runId ? change(run) : run));

      for (const name of [PART_UPSERT_EVENT, PART_DELTA_EVENT]) {
        events.addEventListener(name, (event) => {
          const part = parsePartEvent(
            name,
            (event as MessageEvent<string>).data,
          );
          if (part) {
            update((run) => ({
              ...run,
              parts: applyPartEvent(run.parts, part),
            }));
          }
        });
      }
      events.addEventListener('revision.saved', () => onRevision.current());
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

  const send = useCallback(
    async (prompt: string, runMode: AgentMode) => {
      setError(null);
      setPendingPrompt(prompt);
      setStarting(true);
      const result = await startRunAction(slug, themeId, {
        conversationId,
        prompt,
        mode: runMode,
        context: getContext(),
        idempotencyKey: crypto.randomUUID(),
      });
      setStarting(false);
      if (!result.success) {
        setPendingPrompt(null);
        setError(result.message);
        setPaused(true);
        return;
      }
      setChosen(result.run.conversationId);
      await queryClient.invalidateQueries({
        queryKey: editorKeys.messages(slug, themeId, result.run.conversationId),
      });
      setPendingPrompt(null);
      onSent();
      follow(result.run.id, result.run.conversationId);
    },
    [conversationId, follow, getContext, onSent, queryClient, slug, themeId],
  );

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const prompt = message.content
        .flatMap((part) => (part.type === 'text' ? [part.text] : []))
        .join('\n')
        .trim();
      if (prompt) await send(prompt, mode);
    },
    [mode, send],
  );

  /** The next message starts a new conversation instead of continuing this one. */
  const newConversation = useCallback(() => {
    if (!live) setChosen('new');
  }, [live]);

  /** Building a plan is a build run, whatever mode the picker was left on. */
  const approvePlan = useCallback(() => {
    setMode('BUILD');
    void send(APPROVE_PLAN_PROMPT, 'BUILD');
  }, [send]);

  const enqueueMessage = useCallback((text: string) => {
    setPaused(false);
    setQueued((queue) => enqueue(queue, text, crypto.randomUUID()));
  }, []);
  const removeQueuedMessage = useCallback(
    (id: string) => setQueued((queue) => removeQueued(queue, id)),
    [],
  );
  /** Puts every queued message back as one draft to edit, and empties the queue. */
  const takeBackQueue = useCallback(() => {
    const draft = takeBack(queued);
    setQueued([]);
    return draft;
  }, [queued]);

  const isRunning = starting || !!live;
  useEffect(() => {
    if (isRunning || paused || !queued.length) return;
    const { next, rest } = dequeue(queued);
    if (!next) return;
    setQueued(rest);
    void send(next.text, mode);
  }, [isRunning, paused, queued, send, mode]);

  const prompts = useMemo(
    () => userPromptsOf(messages.data ?? []),
    [messages.data],
  );

  /** Asks again with the last thing the user sent. */
  const retry = useCallback(() => {
    const last = prompts.at(-1);
    if (last && !isRunning) void send(last, mode);
  }, [isRunning, mode, prompts, send]);

  const onCancel = useCallback(async () => {
    if (live) await cancelRunAction(slug, live.id);
  }, [live, slug]);

  const threadMessages = useMemo(() => {
    const saved = (messages.data ?? []).flatMap((message) => {
      const shown = toThreadMessage(message);
      return shown ? [shown] : [];
    });
    return [
      ...saved,
      ...(pendingPrompt
        ? [{ id: 'pending', role: 'user', content: pendingPrompt } as const]
        : []),
      ...(live
        ? [assistantMessage(`live-${live.id}`, live.parts, { running: true })]
        : []),
    ];
  }, [live, messages.data, pendingPrompt]);

  return {
    messages: threadMessages,
    isRunning,
    isLoading:
      conversations.isPending || (!!conversationId && messages.isPending),
    error,
    mode,
    setMode,
    approvePlan,
    newConversation,
    queued,
    enqueueMessage,
    removeQueuedMessage,
    takeBackQueue,
    prompts,
    retry,
    submit: (prompt: string) => send(prompt, mode),
    pinnedTodos: live ? latestTodos(live.parts) : undefined,
    onNew,
    onCancel,
  };
}
