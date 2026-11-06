'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

import { buildFileTree } from '../../lib/file-tree';
import { sourceFileQueryOptions } from '../../queries';
import type { SourceFile } from '../../types';

import { FileTree } from './file-tree';

// Monaco needs the browser, so it can't render on the server.
const CodeViewer = dynamic(() => import('./code-viewer'), { ssr: false });

const DEFAULT_FILE = 'app/page.tsx';

export function CodePane({
  slug,
  themeId,
  files,
}: {
  slug: string;
  themeId: string;
  files: SourceFile[] | null;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const nodes = useMemo(() => buildFileTree(files ?? []), [files]);
  const path =
    picked ??
    (files?.some((f) => f.path === DEFAULT_FILE) ? DEFAULT_FILE : null);

  const file = useQuery({
    ...sourceFileQueryOptions(slug, themeId, path ?? ''),
    enabled: !!path,
  });

  if (!files) {
    return (
      <div className="bg-surface flex size-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-surface flex size-full">
      <div className="border-line border-border-default w-64 shrink-0 overflow-y-auto border-r">
        <FileTree nodes={nodes} selected={path} onSelect={setPicked} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-line border-border-default flex h-10 shrink-0 items-center justify-between gap-2 border-b px-3">
          <span className="text-code text-text-subtle truncate">{path}</span>
          <Badge variant="muted">Read only</Badge>
        </div>
        <div className="min-h-0 flex-1">
          {file.data && (
            <CodeViewer path={file.data.path} content={file.data.content} />
          )}
        </div>
      </div>
    </div>
  );
}
