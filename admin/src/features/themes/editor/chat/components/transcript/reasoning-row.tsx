'use client';

import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import type { ReasoningPart } from '../../model/part';

import { useShowDetails } from './details-context';

function label(part: ReasoningPart, running: boolean) {
  if (running) return 'Thinking…';
  if (part.endedAt === undefined) return 'Thought';
  const seconds = Math.max(
    1,
    Math.round((part.endedAt - part.startedAt) / 1000),
  );
  return `Thought for ${seconds}s`;
}

/** The model's reasoning, folded away unless you want to read it. */
export function ReasoningRow({
  part,
  running,
}: {
  part: ReasoningPart;
  /** True only while the run is live and this reasoning hasn't finished. */
  running: boolean;
}) {
  const showDetails = useShowDetails();
  const [open, setOpen] = useState(false);
  const expanded = (open || showDetails) && !!part.text;

  return (
    <div className="text-body-small text-text-subtle">
      <button
        type="button"
        aria-expanded={expanded}
        disabled={!part.text}
        onClick={() => setOpen(!open)}
        className="focus-visible:ring-border-focused flex items-center gap-1 rounded-xs outline-none focus-visible:ring-(length:--ds-border-width-focused)"
      >
        <ChevronRight
          className={cn('size-3 transition-transform', expanded && 'rotate-90')}
        />
        <span className="italic">{label(part, running)}</span>
      </button>
      {expanded && (
        <p className="border-border-default mt-1 ml-1.5 border-l pl-3 whitespace-pre-wrap italic">
          {part.text}
        </p>
      )}
    </div>
  );
}
