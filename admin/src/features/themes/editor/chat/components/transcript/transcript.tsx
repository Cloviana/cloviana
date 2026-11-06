'use client';

import { ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import { groupParts, type Block } from '../../model/group-parts';
import type { Part } from '../../model/part';

import { useShowDetails } from './details-context';
import { Markdown } from './markdown';
import { NoticeRow } from './notice-row';
import { ReasoningRow } from './reasoning-row';
import { TodoList } from './todo-list';
import { ToolRow } from './tool-row';

function GroupRow({ block }: { block: Extract<Block, { kind: 'group' }> }) {
  const showDetails = useShowDetails();
  const [open, setOpen] = useState(false);
  const expanded = open || showDetails;

  return (
    <div className="text-body">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setOpen(!open)}
        className="text-text-subtle focus-visible:ring-border-focused flex items-center gap-1 rounded-xs outline-none focus-visible:ring-(length:--ds-border-width-focused)"
      >
        <ChevronRight
          className={cn(
            'size-3.5 transition-transform',
            expanded && 'rotate-90',
          )}
        />
        {block.label}
      </button>
      {expanded && (
        <div className="border-border-default mt-1 ml-1.5 flex flex-col gap-1 border-l pl-3">
          {block.parts.map((part) => (
            <ToolRow key={part.id} part={part} />
          ))}
        </div>
      )}
    </div>
  );
}

function PartView({ part, running }: { part: Part; running: boolean }) {
  switch (part.type) {
    case 'text':
      return <Markdown text={part.text} />;
    case 'reasoning':
      return (
        <ReasoningRow
          part={part}
          running={running && part.endedAt === undefined}
        />
      );
    case 'tool':
      return <ToolRow part={part} />;
    case 'todos':
      return <TodoList part={part} />;
    case 'notice':
      return <NoticeRow part={part} />;
  }
}

/** True while the run is live but nothing on screen is moving, so the user can see it hasn't stalled. */
function isIdle(parts: readonly Part[]) {
  const last = parts.at(-1);
  if (!last) return true;
  if (last.type === 'tool')
    return last.status === 'completed' || last.status === 'error';
  if (last.type === 'reasoning') return last.endedAt !== undefined;
  return last.type === 'todos';
}

/** A run's parts in order: the answer, and every step the agent took to get there. */
export function Transcript({
  parts,
  running,
}: {
  parts: readonly Part[];
  running: boolean;
}) {
  const blocks = useMemo(() => groupParts(parts), [parts]);

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block) =>
        block.kind === 'group' ? (
          <GroupRow key={block.id} block={block} />
        ) : (
          <PartView key={block.part.id} part={block.part} running={running} />
        ),
      )}
      {running && isIdle(parts) && (
        <p className="text-body-small text-text-subtlest animate-pulse">
          Working…
        </p>
      )}
    </div>
  );
}
