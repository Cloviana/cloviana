'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { liveChangesQueryOptions, revisionFilesQueryOptions } from '../queries';
import type { SourceFile } from '../types';

const LIVE_POLL_MS = 3000;

/** The saved revision's files, plus whatever the agent has changed so far during a run. */
export function useThemeSource(
  slug: string,
  themeId: string,
  revisionId: string,
  agentRunning: boolean,
) {
  const saved = useQuery(revisionFilesQueryOptions(slug, themeId, revisionId));
  const changes = useQuery({
    ...liveChangesQueryOptions(slug, themeId),
    enabled: agentRunning,
    refetchInterval: agentRunning ? LIVE_POLL_MS : false,
  });
  const live = useMemo(
    () => new Set(agentRunning ? changes.data : []),
    [agentRunning, changes.data],
  );

  const files = useMemo(() => {
    const known = saved.data ?? [];
    const added: SourceFile[] = [...live]
      .filter((path) => !known.some((file) => file.path === path))
      .map((path) => ({ path, size: 0, sha256: null }));
    return [...known, ...added];
  }, [live, saved.data]);

  return { files, live, isLoading: saved.isPending, isError: saved.isError };
}
