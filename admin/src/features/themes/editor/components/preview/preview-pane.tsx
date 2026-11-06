'use client';

import { TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

import type { useEditorWorkspace } from '../../hooks/use-editor-workspace';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<PreviewDevice, string> = {
  desktop: 'w-full',
  tablet: 'w-[768px] max-w-full',
  mobile: 'w-[390px] max-w-full',
};

function Waiting({ label }: { label: string }) {
  return (
    <div className="m-auto flex flex-col items-center gap-2">
      <Spinner />
      <p className="text-body text-text-subtle">{label}</p>
    </div>
  );
}

export function PreviewPane({
  workspace,
  device,
  route,
  reloadKey,
}: {
  workspace: ReturnType<typeof useEditorWorkspace>;
  device: PreviewDevice;
  route: string;
  reloadKey: number;
}) {
  const { status, preview, state } = workspace;

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

  return (
    <div className="bg-surface-sunken flex size-full justify-center">
      {url ? (
        <iframe
          // A new revision or a manual refresh has to reload the storefront.
          key={`${state?.revisionId}-${reloadKey}`}
          title="Theme preview"
          src={new URL(route, url).toString()}
          sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
          className={cn(
            'bg-surface h-full border-0 transition-[width]',
            DEVICE_WIDTHS[device],
          )}
        />
      ) : (
        <Waiting
          label={
            status === 'RUNNING'
              ? 'Almost ready…'
              : "Starting your theme's preview…"
          }
        />
      )}
    </div>
  );
}
