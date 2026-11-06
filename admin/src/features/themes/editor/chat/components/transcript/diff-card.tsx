'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { FileDiff } from '../../model/part';

const COLLAPSED_LINES = 12;
const FILE_HEADER = /^(---|\+\+\+|Index:|={3,})/;

function lineClass(line: string) {
  if (line.startsWith('+')) {
    return 'bg-background-success-subtler text-text-default';
  }
  if (line.startsWith('-')) {
    return 'bg-background-danger-subtler text-text-default';
  }
  if (line.startsWith('@@')) return 'text-text-subtlest';
  return 'text-text-subtle';
}

/** The change an edit made, as a unified diff. Long ones start clipped. */
export function DiffCard({ diff }: { diff: FileDiff }) {
  const lines = useMemo(
    () => diff.patch.split('\n').filter((line) => !FILE_HEADER.test(line)),
    [diff.patch],
  );
  const [expanded, setExpanded] = useState(false);
  const clipped = !expanded && lines.length > COLLAPSED_LINES;
  const shown = clipped ? lines.slice(0, COLLAPSED_LINES) : lines;

  return (
    <div className="border-line border-border-default overflow-hidden rounded-md border">
      <div className="bg-surface-sunken border-border-default text-code text-text-subtle border-b px-3 py-1.5">
        {diff.path}
      </div>
      <pre className="text-code overflow-x-auto py-1">
        {shown.map((line, index) => (
          <div
            key={index}
            className={cn('px-3 whitespace-pre', lineClass(line))}
          >
            {line || ' '}
          </div>
        ))}
      </pre>
      {lines.length > COLLAPSED_LINES && (
        <div className="border-border-default border-t px-2 py-1">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : `Show all ${lines.length} lines`}
          </Button>
        </div>
      )}
    </div>
  );
}
