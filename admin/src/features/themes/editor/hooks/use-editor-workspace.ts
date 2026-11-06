'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { requestWorkspaceAction } from '../actions/request-workspace';
import { restartWorkspaceAction } from '../actions/restart-workspace';
import {
  editorKeys,
  editorStateQueryOptions,
  previewQueryOptions,
  sourceFilesQueryOptions,
} from '../queries';

const STARTING_POLL_MS = 2000;
const SETTLED_POLL_MS = 15000;
// Signed preview URLs last an hour; refreshing often keeps a long session's URL valid.
const PREVIEW_REFRESH_MS = 60000;

/** Starts the theme's sandbox on arrival and follows it until the preview is reachable. */
export function useEditorWorkspace(slug: string, themeId: string) {
  const queryClient = useQueryClient();

  const state = useQuery({
    ...editorStateQueryOptions(slug, themeId),
    refetchInterval: (query) =>
      query.state.data?.workspace?.status === 'RUNNING'
        ? SETTLED_POLL_MS
        : STARTING_POLL_MS,
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

  const files = useQuery({
    ...sourceFilesQueryOptions(slug, themeId),
    enabled: running,
    refetchInterval: (query) =>
      query.state.data === null ? STARTING_POLL_MS : false,
    refetchIntervalInBackground: true,
  });

  // Runs once per page visit; a failed sandbox waits for the user to press Restart.
  const requested = useRef(false);
  useEffect(() => {
    if (!state.data || requested.current) return;
    if (status === 'STOPPED' || status === 'DELETED') {
      requested.current = true;
      void restartWorkspaceAction(slug, themeId);
    } else if (!status) {
      requested.current = true;
      void requestWorkspaceAction(slug, themeId);
    }
  }, [state.data, status, slug, themeId]);

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
    files: files.data ?? null,
    refresh,
    restart,
  };
}
