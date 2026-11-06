'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { requestWorkspaceAction } from '../actions/request-workspace';
import { restartWorkspaceAction } from '../actions/restart-workspace';
import {
  editorKeys,
  editorStateQueryOptions,
  previewQueryOptions,
} from '../queries';
import type { EditorState, WorkspaceStatus } from '../types';

const STARTING_POLL_MS = 2000;
const SETTLED_POLL_MS = 15000;
// Signed preview URLs last an hour; refreshing often keeps a long session's URL valid.
const PREVIEW_REFRESH_MS = 60000;

const TRANSITIONING: WorkspaceStatus[] = ['REQUESTED', 'STARTING', 'STOPPING'];

/** Starts the theme's sandbox once a preview is wanted and follows it until it is reachable. */
export function useEditorWorkspace(
  slug: string,
  themeId: string,
  initialState: EditorState,
  previewWanted: boolean,
) {
  const queryClient = useQueryClient();

  const state = useQuery({
    ...editorStateQueryOptions(slug, themeId),
    initialData: initialState,
    refetchInterval: (query) =>
      TRANSITIONING.includes(
        query.state.data?.workspace?.status as WorkspaceStatus,
      )
        ? STARTING_POLL_MS
        : SETTLED_POLL_MS,
    // A first start takes minutes, and people switch tabs while it happens.
    refetchIntervalInBackground: true,
  });
  const status = state.data?.workspace?.status;
  const revisionId = state.data?.revisionId;
  const running = status === 'RUNNING';

  const preview = useQuery({
    ...previewQueryOptions(slug, themeId),
    enabled: running,
    refetchInterval: (query) =>
      query.state.data?.ready ? PREVIEW_REFRESH_MS : STARTING_POLL_MS,
    refetchIntervalInBackground: true,
  });

  // Runs once per page visit; a failed sandbox waits for the user to press Restart.
  const requested = useRef(false);
  useEffect(() => {
    if (!previewWanted || requested.current) return;
    if (status === 'STOPPED' || status === 'DELETED') {
      requested.current = true;
      void restartWorkspaceAction(slug, themeId);
    } else if (!status) {
      requested.current = true;
      void requestWorkspaceAction(slug, themeId);
    }
  }, [previewWanted, status, slug, themeId]);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: editorKeys.all(slug, themeId),
    });
  }, [queryClient, slug, themeId]);

  // A new revision reaches the sandbox through a restore, so everything read from it is stale.
  const seenRevision = useRef(revisionId);
  useEffect(() => {
    if (seenRevision.current === revisionId) return;
    seenRevision.current = revisionId;
    refresh();
  }, [revisionId, refresh]);

  const restart = useCallback(async () => {
    const result = await restartWorkspaceAction(slug, themeId);
    refresh();
    return result;
  }, [refresh, slug, themeId]);

  return {
    state: state.data,
    status,
    errorCode: state.data?.workspace?.errorCode ?? null,
    preview: preview.data,
    refresh,
    restart,
  };
}
