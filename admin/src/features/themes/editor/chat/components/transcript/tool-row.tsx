'use client';

import { Check, CornerDownRight, X } from 'lucide-react';
import { useState } from 'react';

import { Spinner } from '@/components/ui/spinner';

import type { ToolPart } from '../../model/part';
import { toolLabel, toolSubject, toolSummary } from '../../model/tool-summary';

import { useShowDetails } from './details-context';
import { DiffCard } from './diff-card';

function StatusIcon({ status }: { status: ToolPart['status'] }) {
  if (status === 'completed') {
    return (
      <Check
        aria-label="Done"
        className="text-icon-success size-3.5 shrink-0"
      />
    );
  }
  if (status === 'error') {
    return (
      <X aria-label="Failed" className="text-icon-danger size-3.5 shrink-0" />
    );
  }
  return <Spinner className="size-3.5 shrink-0" />;
}

/**
 * One step the agent took: what it did, to what, and how it went. An edit shows its diff; any
 * other step with output can be opened to read that output.
 */
export function ToolRow({ part }: { part: ToolPart }) {
  const showDetails = useShowDetails();
  const [open, setOpen] = useState(false);
  const subject = toolSubject(part);
  const summary = toolSummary(part);
  const canOpen = !!part.output && !part.diff && part.output !== summary;
  const expanded = canOpen && (open || showDetails);

  return (
    <div className="text-body">
      <div className="flex items-center gap-2">
        <StatusIcon status={part.status} />
        <span className="text-text-default font-medium">
          {toolLabel(part.tool)}
        </span>
        {subject && (
          <span className="text-code text-text-subtle min-w-0 truncate">
            {subject}
          </span>
        )}
      </div>
      {summary && (
        <div className="text-body-small text-text-subtlest mt-0.5 ml-5 flex items-start gap-1.5">
          <CornerDownRight className="mt-0.5 size-3 shrink-0" />
          <span className="min-w-0 break-words">{summary}</span>
          {canOpen && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(!open)}
              className="text-link-default focus-visible:ring-border-focused ml-1 rounded-xs outline-none hover:underline focus-visible:ring-(length:--ds-border-width-focused)"
            >
              {expanded ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
      )}
      {expanded && (
        <pre className="bg-surface-sunken text-code text-text-subtle mt-1 ml-5 max-h-64 overflow-auto rounded-md p-2 whitespace-pre-wrap">
          {part.output}
        </pre>
      )}
      {part.diff && (
        <div className="mt-1 ml-5">
          <DiffCard diff={part.diff} />
        </div>
      )}
    </div>
  );
}
