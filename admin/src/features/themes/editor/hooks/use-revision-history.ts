'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { redoRevisionAction } from '../actions/redo-revision';
import { restoreRevisionAction } from '../actions/restore-revision';
import { undoRevisionAction } from '../actions/undo-revision';
import { revisionsQueryOptions } from '../queries';

export function useRevisionHistory(
  slug: string,
  themeId: string,
  onChanged: () => void,
) {
  const history = useQuery(revisionsQueryOptions(slug, themeId));
  const head = history.data?.headRevisionId;
  const current = history.data?.revisions.find((r) => r.id === head);

  const navigate = useMutation({
    mutationFn: async (operation: {
      type: 'undo' | 'redo' | 'restore';
      id?: string;
    }) => {
      if (!head) throw new Error('No revision to move from');
      const result =
        operation.type === 'undo'
          ? await undoRevisionAction(slug, themeId, head)
          : operation.type === 'redo'
            ? await redoRevisionAction(slug, themeId, head)
            : await restoreRevisionAction(slug, themeId, operation.id!, head);
      if (!result.success) throw new Error(result.message);
    },
    onError: (error) => toast.error(error.message),
    onSettled: onChanged,
  });

  return {
    revisions: history.data?.revisions ?? [],
    headRevisionId: head ?? null,
    canUndo: !!current?.parentRevisionId,
    canRedo: !!history.data?.canRedo,
    isNavigating: navigate.isPending,
    undo: () => navigate.mutate({ type: 'undo' }),
    redo: () => navigate.mutate({ type: 'redo' }),
    restore: (id: string) => navigate.mutate({ type: 'restore', id }),
  };
}
