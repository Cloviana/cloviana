'use client';

import { ComposerPrimitive, useAui, useAuiState } from '@assistant-ui/react';
import { ArrowUp, ListPlus, Square } from 'lucide-react';
import { useRef, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button';

import { recall } from '../../chat/model/prompt-history';
import type { Chip } from '../../chat/model/run-context';
import type { SlashCommandId } from '../../chat/model/slash-commands';
import type { useAgentThread } from '../../hooks/use-agent-thread';
import type { SourceFile } from '../../types';

import { ContextChips } from './context-chips';
import { MentionPopover } from './mention-popover';
import { ModePicker } from './mode-picker';
import { PinnedTodos } from './pinned-todos';
import { QueuedMessages } from './queued-messages';
import { SlashPopover } from './slash-popover';

/** The message box: what is attached, the text, `@` and `/` menus, the mode, and send or stop. */
export function Composer({
  thread,
  chips,
  onDismissChip,
  files,
  onMention,
  onCommand,
}: {
  thread: ReturnType<typeof useAgentThread>;
  chips: readonly Chip[];
  onDismissChip: (chip: Chip) => void;
  files: readonly SourceFile[];
  onMention: (path: string) => void;
  onCommand: (id: SlashCommandId) => void;
}) {
  const aui = useAui();
  const text = useAuiState((state) => state.composer.text);
  // Where the user is in the history of what they sent, and what that put in the box.
  const recalled = useRef<{ cursor: number; text: string } | null>(null);

  const queueNow = () => {
    thread.enqueueMessage(text);
    aui.composer().setText('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Keys the menus or the input method already used are theirs.
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    const box = event.currentTarget;

    if (event.key === 'Enter' && !event.shiftKey && thread.isRunning) {
      event.preventDefault();
      if (text.trim()) queueNow();
      return;
    }

    const active = recalled.current?.text === text ? recalled.current : null;
    const atStart = box.selectionStart === 0 && box.selectionEnd === 0;
    const atEnd =
      box.selectionStart === text.length && box.selectionEnd === text.length;

    if (
      event.key === 'ArrowUp' &&
      !event.shiftKey &&
      atStart &&
      (!text || active)
    ) {
      if (!text && thread.queued.length) {
        event.preventDefault();
        aui.composer().setText(thread.takeBackQueue());
        return;
      }
      const next = recall(thread.prompts, active?.cursor ?? null, 'older');
      if (next.cursor !== null) {
        event.preventDefault();
        recalled.current = { cursor: next.cursor, text: next.text };
        aui.composer().setText(next.text);
      }
    } else if (
      event.key === 'ArrowDown' &&
      !event.shiftKey &&
      atEnd &&
      active
    ) {
      event.preventDefault();
      const next = recall(thread.prompts, active.cursor, 'newer');
      recalled.current =
        next.cursor === null ? null : { cursor: next.cursor, text: next.text };
      aui.composer().setText(next.text);
    }
  };

  return (
    <div className="p-3 pt-0">
      <ComposerPrimitive.Root className="border-line bg-surface focus-within:border-border-focused border-border-input relative rounded-lg">
        <ComposerPrimitive.TriggerPopoverRoot>
          <PinnedTodos todos={thread.pinnedTodos} />
          <QueuedMessages
            queued={thread.queued}
            onRemove={thread.removeQueuedMessage}
          />
          <ContextChips chips={chips} onDismiss={onDismissChip} />
          <ComposerPrimitive.Input
            rows={2}
            onKeyDown={onKeyDown}
            placeholder="Ask the agent about your theme. @ points at a file, / runs a command."
            className="text-body text-text-default placeholder:text-text-subtlest block max-h-40 w-full resize-none bg-transparent px-3 pt-2 outline-none"
          />
          <MentionPopover files={files} onMention={onMention} />
          <SlashPopover onCommand={onCommand} />
          <div className="flex items-center justify-between p-2">
            <ModePicker
              value={thread.mode}
              onChange={thread.setMode}
              disabled={thread.isRunning}
            />
            {thread.isRunning ? (
              <div className="flex gap-1">
                <Button
                  size="icon-xs"
                  variant="outline"
                  aria-label="Queue message"
                  title="Send after the agent finishes"
                  disabled={!text.trim()}
                  onClick={queueNow}
                >
                  <ListPlus />
                </Button>
                <ComposerPrimitive.Cancel
                  render={
                    <Button
                      size="icon-xs"
                      variant="secondary"
                      aria-label="Stop the agent"
                    />
                  }
                >
                  <Square />
                </ComposerPrimitive.Cancel>
              </div>
            ) : (
              <ComposerPrimitive.Send
                render={<Button size="icon-xs" aria-label="Send" />}
              >
                <ArrowUp />
              </ComposerPrimitive.Send>
            )}
          </div>
        </ComposerPrimitive.TriggerPopoverRoot>
      </ComposerPrimitive.Root>
    </div>
  );
}
