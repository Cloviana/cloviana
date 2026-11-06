'use client';

import { FileText, X } from 'lucide-react';

import { Spinner } from '@/components/ui/spinner';

import type { ReferenceItem } from '../../hooks/use-reference-uploads';

/** Files attached to the next message. Images show a small preview; each can be removed. */
export function AttachmentChips({
  items,
  onRemove,
}: {
  items: readonly ReferenceItem[];
  onRemove: (key: string) => void;
}) {
  if (!items.length) return null;

  return (
    <ul aria-label="Attached files" className="flex flex-wrap gap-1 px-2 pt-2">
      {items.map((item) => (
        <li
          key={item.key}
          title={item.name}
          className="bg-background-neutral text-body-small text-text-default flex max-w-full items-center gap-1.5 rounded-sm py-0.5 pr-0.5 pl-1"
        >
          {item.previewUrl ? (
            <img
              src={item.previewUrl}
              alt=""
              className="size-5 rounded-xs object-cover"
            />
          ) : (
            <FileText className="text-icon-subtle size-4 shrink-0" />
          )}
          <span className="max-w-32 truncate">{item.name}</span>
          {!item.id && <Spinner className="size-3" />}
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            onClick={() => onRemove(item.key)}
            className="hover:bg-background-neutral-hovered focus-visible:ring-border-focused rounded-xs p-0.5 outline-none focus-visible:ring-(length:--ds-border-width-focused)"
          >
            <X className="size-3" />
          </button>
        </li>
      ))}
    </ul>
  );
}
