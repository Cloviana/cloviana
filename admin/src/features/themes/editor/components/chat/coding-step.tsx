'use client';

import type { ToolCallMessagePartProps } from '@assistant-ui/react';
import { Check, X } from 'lucide-react';

import { Spinner } from '@/components/ui/spinner';

/** One line per tool the coding agent uses, so a long edit visibly makes progress. */
export function CodingStep({
  toolName,
  result,
  isError,
}: ToolCallMessagePartProps) {
  const done = result !== undefined;

  return (
    <div className="text-body-small text-text-subtle flex items-center gap-2">
      {!done && <Spinner className="size-3" />}
      {done && !isError && <Check className="text-icon-success size-3" />}
      {isError && <X className="text-icon-danger size-3" />}
      <span className="truncate">{toolName}</span>
    </div>
  );
}
