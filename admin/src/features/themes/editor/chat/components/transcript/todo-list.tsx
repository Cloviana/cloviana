import { Check, Circle, CircleDot, X } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { TodosPart } from '../../model/part';

const ICON = {
  completed: <Check aria-label="Done" className="text-icon-success size-3.5" />,
  in_progress: (
    <CircleDot
      aria-label="In progress"
      className="text-icon-information size-3.5"
    />
  ),
  pending: <Circle aria-label="To do" className="text-icon-subtle size-3.5" />,
  cancelled: <X aria-label="Cancelled" className="text-icon-subtle size-3.5" />,
} as const;

/** The agent's own checklist for the work, ticked off as it goes. */
export function TodoList({ part }: { part: TodosPart }) {
  if (!part.items.length) return null;
  const done = part.items.filter((item) => item.status === 'completed').length;

  return (
    <div className="border-line border-border-default rounded-md border px-3 py-2">
      <p className="text-body-small text-text-subtle mb-1 font-medium">
        Tasks · {done}/{part.items.length}
      </p>
      <ul className="flex flex-col gap-1">
        {part.items.map((item, index) => (
          <li key={index} className="text-body flex items-start gap-2">
            <span className="mt-0.5 shrink-0">{ICON[item.status]}</span>
            <span
              className={cn(
                'min-w-0 break-words',
                item.status === 'completed' && 'text-text-subtle line-through',
                item.status === 'cancelled' &&
                  'text-text-subtlest line-through',
              )}
            >
              {item.content}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
