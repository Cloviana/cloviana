'use client';

import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

import type { Selection } from '../../chat/model/run-context';
import type { useThemeSource } from '../../hooks/use-theme-source';
import { buildFileTree } from '../../lib/file-tree';
import { liveFileQueryOptions, storedFileQueryOptions } from '../../queries';

import { FileTree } from './file-tree';
import { PlainCode } from './plain-code';

const CodeViewer = lazy(() => import('./code-viewer'));

const DEFAULT_FILE = 'app/page.tsx';
const LIVE_POLL_MS = 3000;

export function CodePane({
  slug,
  themeId,
  source,
  onFileChange,
  onSelectionChange,
}: {
  slug: string;
  themeId: string;
  source: ReturnType<typeof useThemeSource>;
  /** The file being shown, so the chat can refer to it. */
  onFileChange: (path: string | null) => void;
  /** The lines the user has selected, so the chat can refer to them. */
  onSelectionChange: (selection: Selection | null) => void;
}) {
  const { files, live } = source;
  const [picked, setPicked] = useState<string | null>(null);
  const nodes = useMemo(() => buildFileTree(files), [files]);
  const path =
    picked ??
    (files.some((file) => file.path === DEFAULT_FILE) ? DEFAULT_FILE : null);
  const entry = files.find((file) => file.path === path);
  const isLive = !!path && live.has(path);

  const stored = useQuery({
    ...storedFileQueryOptions(slug, themeId, entry?.sha256 ?? ''),
    enabled: !isLive && !!entry?.sha256,
  });
  const liveFile = useQuery({
    ...liveFileQueryOptions(slug, themeId, path ?? ''),
    enabled: isLive,
    refetchInterval: isLive ? LIVE_POLL_MS : false,
  });
  const content = isLive ? liveFile.data?.content : stored.data;

  useEffect(() => {
    onFileChange(path);
    onSelectionChange(null);
    return () => {
      onFileChange(null);
      onSelectionChange(null);
    };
  }, [path, onFileChange, onSelectionChange]);

  if (source.isLoading) {
    return (
      <div className="bg-surface flex size-full items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (source.isError) {
    return (
      <div className="bg-surface flex size-full items-center justify-center">
        <p className="text-body text-text-subtle">
          This version&apos;s files couldn&apos;t be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface flex size-full">
      <div className="border-line border-border-default w-64 shrink-0 overflow-y-auto border-r">
        <FileTree
          nodes={nodes}
          selected={path}
          live={live}
          onSelect={setPicked}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-line border-border-default flex h-10 shrink-0 items-center justify-between gap-2 border-b px-3">
          <span className="text-code text-text-subtle truncate">{path}</span>
          {isLive ? (
            <Badge variant="information">Agent editing, not saved</Badge>
          ) : (
            <Badge variant="muted">Read only</Badge>
          )}
        </div>
        <div className="min-h-0 flex-1">
          {entry && !isLive && !entry.sha256 ? (
            <p className="text-body text-text-subtle p-3">
              This file is binary or too large to show.
            </p>
          ) : (
            content !== undefined &&
            path && (
              <Suspense fallback={<PlainCode content={content} />}>
                <CodeViewer
                  path={path}
                  content={content}
                  onSelectionChange={onSelectionChange}
                />
              </Suspense>
            )
          )}
        </div>
      </div>
    </div>
  );
}
