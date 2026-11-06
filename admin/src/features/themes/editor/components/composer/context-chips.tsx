'use client';

import { FileText, Globe, TextCursorInput, X } from 'lucide-react';

import type { Chip, ChipKind } from '../../chat/model/run-context';

const ICON: Record<ChipKind, typeof FileText> = {
  page: Globe,
  file: FileText,
  selection: TextCursorInput,
  mention: FileText,
};

/** What the next message will carry along, each removable. Nothing hidden is ever sent. */
export function ContextChips({
  chips,
  onDismiss,
}: {
  chips: readonly Chip[];
  onDismiss: (chip: Chip) => void;
}) {
  if (!chips.length) return null;

  return (
    <ul
      aria-label="Included with your message"
      className="flex flex-wrap gap-1 px-2 pt-2"
    >
      {chips.map((chip) => {
        const Icon = ICON[chip.kind];
        return (
          <li
            key={`${chip.kind}:${chip.id}`}
            title={chip.title}
            className="bg-background-neutral text-body-small text-text-default flex max-w-full items-center gap-1 rounded-sm py-0.5 pr-0.5 pl-1.5"
          >
            <Icon className="text-icon-subtle size-3 shrink-0" />
            <span className="truncate">{chip.label}</span>
            <button
              type="button"
              aria-label={`Remove ${chip.label}`}
              onClick={() => onDismiss(chip)}
              className="hover:bg-background-neutral-hovered focus-visible:ring-border-focused rounded-xs p-0.5 outline-none focus-visible:ring-(length:--ds-border-width-focused)"
            >
              <X className="size-3" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
