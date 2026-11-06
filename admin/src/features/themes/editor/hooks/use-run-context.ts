'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  addMention as withMention,
  afterSend as afterSendState,
  chipsOf,
  dismissChip,
  EMPTY_CONTEXT,
  toRunContext,
  type Chip,
  type ContextSources,
  type ContextState,
  type RunContext,
} from '../chat/model/run-context';

/**
 * What the user is looking at, as chips they can remove, and the context that goes with their next
 * message. The state is only what they dismissed or added; the rest follows `sources`.
 */
export function useRunContext(sources: ContextSources) {
  const [state, setState] = useState<ContextState>(EMPTY_CONTEXT);

  const chips = useMemo(() => chipsOf(sources, state), [sources, state]);
  const context = useMemo(() => toRunContext(sources, state), [sources, state]);

  const dismiss = useCallback(
    (chip: Pick<Chip, 'kind' | 'id'>) =>
      setState((current) => dismissChip(current, chip)),
    [],
  );
  const addMention = useCallback(
    (path: string) => setState((current) => withMention(current, path)),
    [],
  );
  const afterSend = useCallback(() => setState(afterSendState), []);

  return {
    chips,
    context: context as RunContext | undefined,
    dismiss,
    addMention,
    afterSend,
  };
}
