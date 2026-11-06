'use client';

import {
  ArrowLeft,
  Code2,
  ExternalLink,
  Eye,
  History,
  Monitor,
  Redo2,
  RefreshCw,
  Smartphone,
  Tablet,
  Undo2,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { paths } from '@/config/paths';

import type { PreviewDevice } from './preview/preview-pane';

export type EditorTab = 'preview' | 'code';

function IconAction({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & React.ComponentProps<
  typeof Button
>) {
  return (
    <Tooltip>
      {/* A disabled button fires no hover events, so the tooltip hangs off a wrapper. */}
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Button size="icon" variant="ghost" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

interface EditorTopBarProps {
  slug: string;
  themeName: string;
  tab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  historyOpen: boolean;
  onToggleHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  route: string;
  routes: string[];
  onRouteChange: (route: string) => void;
  onReload: () => void;
  previewUrl: string | null;
}

export function EditorTopBar({
  slug,
  themeName,
  tab,
  onTabChange,
  historyOpen,
  onToggleHistory,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  device,
  onDeviceChange,
  route,
  routes,
  onRouteChange,
  onReload,
  previewUrl,
}: EditorTopBarProps) {
  return (
    <header className="bg-surface border-line border-border-default grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b px-2">
      <div className="flex min-w-0 items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          aria-label="Back to themes"
          render={<Link href={paths.mp.themes.getHref(slug)} />}
          nativeButton={false}
        >
          <ArrowLeft />
        </Button>
        <span className="text-body text-text-default truncate px-1 font-medium">
          {themeName}
        </span>
        <IconAction
          label={historyOpen ? 'Back to chat' : 'History'}
          onClick={onToggleHistory}
          aria-pressed={historyOpen}
        >
          <History />
        </IconAction>
        <IconAction label="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2 />
        </IconAction>
        <IconAction label="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2 />
        </IconAction>
      </div>

      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          value={tab}
          onValueChange={(value) => value && onTabChange(value as EditorTab)}
          aria-label="Editor view"
        >
          <ToggleGroupItem value="preview">
            <Eye />
            Preview
          </ToggleGroupItem>
          <ToggleGroupItem value="code">
            <Code2 />
            Code
          </ToggleGroupItem>
        </ToggleGroup>

        {tab === 'preview' && (
          <>
            <ToggleGroup
              type="single"
              value={device}
              onValueChange={(value) =>
                value && onDeviceChange(value as PreviewDevice)
              }
              aria-label="Preview size"
            >
              <ToggleGroupItem value="desktop" aria-label="Desktop">
                <Monitor />
              </ToggleGroupItem>
              <ToggleGroupItem value="tablet" aria-label="Tablet">
                <Tablet />
              </ToggleGroupItem>
              <ToggleGroupItem value="mobile" aria-label="Mobile">
                <Smartphone />
              </ToggleGroupItem>
            </ToggleGroup>

            <Select
              value={route}
              onValueChange={(value) => onRouteChange(value as string)}
            >
              <SelectTrigger className="w-40" aria-label="Preview page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {routes.map((path) => (
                  <SelectItem key={path} value={path}>
                    {path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <IconAction label="Refresh preview" onClick={onReload}>
              <RefreshCw />
            </IconAction>
            <IconAction
              label="Open in a new tab"
              disabled={!previewUrl}
              onClick={() =>
                previewUrl &&
                window.open(new URL(route, previewUrl), '_blank', 'noopener')
              }
            >
              <ExternalLink />
            </IconAction>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <Button disabled>Publish</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Publishing isn&apos;t available yet
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
