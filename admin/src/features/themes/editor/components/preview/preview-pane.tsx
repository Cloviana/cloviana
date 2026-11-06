'use client';

import { TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

import type { useEditorWorkspace } from '../../hooks/use-editor-workspace';

const STUCK_AFTER_MS = 30_000;

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<PreviewDevice, string> = {
  desktop: 'w-full',
  tablet: 'w-[768px] max-w-full',
  mobile: 'w-[390px] max-w-full',
};

/** Shows the revision as it looked when saved, so opening never starts from a blank pane. */
function SavedPicture({
  src,
  label,
  device,
}: {
  src: string;
  label: string;
  device: PreviewDevice;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="absolute inset-0 flex justify-center">
      <div className={cn('relative h-full', DEVICE_WIDTHS[device])}>
        {!failed && (
          <img
            src={src}
            alt=""
            // A server-rendered image can fail before React attaches onError.
            ref={(image) => {
              if (image?.complete && !image.naturalWidth) setFailed(true);
            }}
            onError={() => setFailed(true)}
            className="size-full object-cover object-top"
          />
        )}
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <span className="bg-surface-overlay shadow-overlay text-body-small text-text-subtle flex items-center gap-2 rounded-md px-3 py-1.5">
            <Spinner className="size-3" />
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PreviewPane({
  workspace,
  device,
  route,
  reloadKey,
  pictureUrl,
}: {
  workspace: ReturnType<typeof useEditorWorkspace>;
  device: PreviewDevice;
  route: string;
  reloadKey: number;
  pictureUrl: string;
}) {
  const { status, preview, state } = workspace;
  const frameKey = `${state?.revisionId}-${route}-${reloadKey}`;
  // The picture stays up until this frame has painted, so the swap never flashes blank.
  const [paintedFrame, setPaintedFrame] = useState<string | null>(null);

  // A dev server can die while its sandbox lives on, which only a restart fixes.
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  const waiting = status === 'RUNNING' && !preview?.ready;
  useEffect(() => {
    setWaitedTooLong(false);
    if (!waiting) return;
    const timer = setTimeout(() => setWaitedTooLong(true), STUCK_AFTER_MS);
    return () => clearTimeout(timer);
  }, [waiting]);

  if (status === 'FAILED') {
    return (
      <div className="bg-surface-sunken flex size-full">
        <div className="m-auto flex max-w-80 flex-col items-center gap-3 text-center">
          <TriangleAlert className="text-icon-danger size-6" />
          <p className="text-body text-text-subtle">
            The preview couldn&apos;t start
            {workspace.errorCode ? ` (${workspace.errorCode})` : ''}.
          </p>
          <Button variant="outline" onClick={() => void workspace.restart()}>
            Restart preview
          </Button>
        </div>
      </div>
    );
  }

  const url = preview?.ready ? preview.url : null;
  const stuck = status === 'RUNNING' && !url && waitedTooLong;

  return (
    <div className="bg-surface-sunken relative flex size-full justify-center">
      {url && (
        <iframe
          key={frameKey}
          title="Theme preview"
          src={new URL(route, url).toString()}
          sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
          onLoad={() => setPaintedFrame(frameKey)}
          className={cn(
            'bg-surface h-full border-0 transition-[width]',
            DEVICE_WIDTHS[device],
          )}
        />
      )}
      {stuck && (
        <div className="absolute top-3 z-10">
          <Button variant="outline" onClick={() => void workspace.restart()}>
            Restart preview
          </Button>
        </div>
      )}
      {paintedFrame !== frameKey && (
        <SavedPicture
          key={pictureUrl}
          src={pictureUrl}
          device={device}
          label={url ? 'Loading live preview…' : 'Starting live preview…'}
        />
      )}
    </div>
  );
}
