import { FileVideoIcon, ImageOffIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

import type { FileAsset } from '../types/file';

export function FileGridItem({
  file,
  selected,
  onToggle,
  uploadStatus,
  onRetry,
}: {
  file: Pick<FileAsset, 'filename' | 'url' | 'type' | 'mimeType'>;
  selected: boolean;
  onToggle?: () => void;
  uploadStatus?: 'uploading' | 'failed';
  onRetry?: () => void;
}) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const filename = file.filename || 'Untitled file';
  const dot = filename.lastIndexOf('.');
  const extension =
    dot > 0 && /^[a-z0-9]{1,10}$/i.test(filename.slice(dot + 1))
      ? filename.slice(dot + 1)
      : null;
  const name = extension ? filename.slice(0, dot) : filename;
  const mimeFormat = file.mimeType?.split('/')[1]?.toUpperCase();
  const format =
    extension?.toUpperCase() ||
    (mimeFormat === 'JPEG' ? 'JPG' : mimeFormat) ||
    file.type;

  return (
    <Item
      role="listitem"
      onClick={uploadStatus ? undefined : onToggle}
      className={cn(
        'min-w-0 cursor-pointer flex-col items-stretch gap-2 p-2',
        selected
          ? 'bg-background-selected hover:bg-background-selected-hovered active:bg-background-selected-pressed'
          : 'hover:bg-background-neutral-subtle-hovered active:bg-background-neutral-subtle-pressed',
      )}
    >
      <ItemMedia className="bg-surface border-border-default border-line relative aspect-square w-full overflow-hidden rounded-lg">
        {file.type === 'IMAGE' && !previewFailed ? (
          <Image
            src={file.url}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 40vw, 160px"
            className="object-contain"
            onError={() => setPreviewFailed(true)}
          />
        ) : file.type === 'VIDEO' ? (
          <FileVideoIcon
            aria-hidden="true"
            className="text-icon-subtle size-8"
          />
        ) : (
          <ImageOffIcon
            aria-hidden="true"
            className="text-icon-subtle size-8"
          />
        )}
        {uploadStatus === 'uploading' && (
          <div
            role="status"
            aria-label={`Uploading ${filename}`}
            className="text-text-default pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/5 backdrop-blur"
          >
            <Spinner variant="spokes" aria-hidden="true" />
          </div>
        )}
        {uploadStatus === 'failed' && (
          <div className="text-text-default absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/5 backdrop-blur">
            <span role="status" className="text-body text-center font-medium">
              Upload failed
            </span>
            <button
              type="button"
              className="text-text-selected text-body font-medium underline"
              onClick={onRetry}
            >
              Retry
            </button>
          </div>
        )}
        {!uploadStatus && (
          <Checkbox
            aria-label={`Select ${name}`}
            checked={selected}
            onCheckedChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            className="absolute top-2 left-2"
          />
        )}
      </ItemMedia>
      <ItemContent className="w-full min-w-0 items-center gap-0 text-center">
        <ItemTitle
          className="text-body-small line-clamp-none block w-full truncate"
          title={filename}
        >
          {name}
        </ItemTitle>
        <ItemDescription className="text-body-small text-center">
          {format}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
