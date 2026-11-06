'use client';

import { formatDistanceToNow } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { useRevisionHistory } from '../../hooks/use-revision-history';

export function HistoryPanel({
  history,
  disabled,
}: {
  history: ReturnType<typeof useRevisionHistory>;
  disabled: boolean;
}) {
  return (
    <ul className="flex h-full flex-col gap-1 overflow-y-auto p-2">
      {history.revisions.map((revision) => {
        const current = revision.id === history.headRevisionId;
        return (
          <li
            key={revision.id}
            className="hover:bg-surface-hovered flex items-center gap-2 rounded-md p-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-body text-text-default truncate">
                {revision.message ?? 'Theme created'}
              </p>
              <p className="text-body-small text-text-subtlest">
                {formatDistanceToNow(new Date(revision.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            {current ? (
              <Badge variant="muted">Current</Badge>
            ) : (
              <Button
                size="xs"
                variant="outline"
                disabled={disabled || history.isNavigating}
                onClick={() => history.restore(revision.id)}
              >
                Restore
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
