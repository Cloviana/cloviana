import { Info, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { NoticePart } from '../../model/part';

/** Something that happened to the run itself, such as a retry, a stop or a failure. */
export function NoticeRow({ part }: { part: NoticePart }) {
  const Icon = part.level === 'info' ? Info : TriangleAlert;
  return (
    <div
      className={cn(
        'text-body-small flex items-start gap-2',
        part.level === 'error' ? 'text-text-danger' : 'text-text-subtle',
      )}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0" />
      <span className="min-w-0 break-words">{part.text}</span>
    </div>
  );
}
