'use client';

import {
  ActionBarPrimitive,
  MessagePrimitive,
  useAuiState,
} from '@assistant-ui/react';
import { Check, Copy, History, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { TranscriptMetadata } from '../model/to-thread-message';

import { useChatActions } from './chat-actions-context';
import { PlanApproval } from './plan-approval';
import { Transcript } from './transcript/transcript';

/** A tick for a moment after the answer is copied, so the click is acknowledged. */
function CopyIcon() {
  const copied = useAuiState((state) => state.message.isCopied);
  return copied ? <Check /> : <Copy />;
}

export function UserMessage() {
  const id = useAuiState((state) => state.message.id);
  const { rewindTargetOf, rewind } = useChatActions();
  const canRewind = !!rewindTargetOf(id);

  return (
    <MessagePrimitive.Root className="group flex items-start justify-end gap-1">
      {canRewind && (
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Restore the theme to before this message"
          title="Restore the theme to before this message"
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          onClick={() => rewind(id)}
        >
          <History />
        </Button>
      )}
      <div className="bg-background-neutral text-body text-text-default max-w-[85%] rounded-lg px-3 py-2 break-words whitespace-pre-wrap">
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
}

export function AssistantMessage() {
  const parts = useAuiState(
    (state) =>
      (state.message.metadata.custom as Partial<TranscriptMetadata> | undefined)
        ?.parts,
  );
  const running = useAuiState(
    (state) => state.message.status?.type === 'running',
  );
  const offersBuild = useAuiState(
    (state) =>
      state.message.isLast &&
      (state.message.metadata.custom as Partial<TranscriptMetadata> | undefined)
        ?.mode === 'PLAN',
  );

  return (
    <MessagePrimitive.Root>
      <Transcript parts={parts ?? []} running={running} />
      {offersBuild && !running && <PlanApproval />}
      <ActionBarPrimitive.Root
        hideWhenRunning
        autohide="not-last"
        className="mt-1 flex gap-1"
      >
        <ActionBarPrimitive.Copy
          render={
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Copy the answer"
            />
          }
        >
          <CopyIcon />
        </ActionBarPrimitive.Copy>
        <ActionBarPrimitive.Reload
          render={
            <Button size="icon-xs" variant="ghost" aria-label="Ask again" />
          }
        >
          <RotateCcw />
        </ActionBarPrimitive.Reload>
      </ActionBarPrimitive.Root>
    </MessagePrimitive.Root>
  );
}
