'use client';

import { X } from 'lucide-react';

import type { QueuedMessage } from '../../chat/model/message-queue';

/** Messages waiting for the agent to finish. Shown muted until they are sent, and removable. */
export function QueuedMessages({
  queued,
  onRemove,
}: {
  queued: readonly QueuedMessage[];
  onRemove: (id: string) => void;
}) {
  if (!queued.length) return null;

  return (
    <ul aria-label="Waiting to send" className="flex flex-col gap-1 px-3 pb-2">
      {queued.map((message) => (
        <li
          key={message.id}
          className="bg-background-neutral text-body text-text-subtle flex items-start gap-2 rounded-md px-3 py-1.5"
        >
          <span className="min-w-0 flex-1 break-words whitespace-pre-wrap">
            {message.text}
          </span>
          <button
            type="button"
            aria-label="Remove queued message"
            onClick={() => onRemove(message.id)}
            className="hover:bg-background-neutral-hovered focus-visible:ring-border-focused mt-0.5 shrink-0 rounded-xs p-0.5 outline-none focus-visible:ring-(length:--ds-border-width-focused)"
          >
            <X className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
