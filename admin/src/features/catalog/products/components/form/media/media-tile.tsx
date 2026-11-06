import { type UseSortableInput, useSortable } from '@dnd-kit/react/sortable';
import Image from 'next/image';

import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import productCatalogImage from '@public/images/empty-states/product-catalog.png';

import type { MediaItem } from './media';

const tileClassName =
  'bg-surface border-border-default relative overflow-hidden rounded-lg border-line';

// The image (or placeholder) plus the "Processing..." state.
function MediaPreview({
  item,
  selected = false,
  onReady,
}: {
  item: MediaItem;
  selected?: boolean;
  onReady?: (failed: boolean) => void;
}) {
  return (
    <>
      <Image
        src={item.url ?? productCatalogImage}
        alt={item.url ? item.name : ''}
        fill
        unoptimized
        sizes="200px"
        // The browser's native image drag would fight the reorder drag.
        draggable={false}
        onLoad={() => onReady?.(false)}
        onError={() => onReady?.(true)}
        className={cn(
          'object-contain transition-opacity',
          selected && 'opacity-60',
        )}
      />
      {!item.ready && (
        <div className="bg-surface text-body absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Image
            src={productCatalogImage}
            alt=""
            fill
            unoptimized
            sizes="200px"
            draggable={false}
            className="object-contain p-6 opacity-(--ds-opacity-loading)"
          />
          <Spinner className="relative" />
          <span className="relative">Processing...</span>
        </div>
      )}
    </>
  );
}

export function SortableMediaTile({
  item,
  index,
  transition,
  selected,
  onToggle,
  onReady,
  uploadStatus,
  onRetry,
  className,
}: {
  item: MediaItem;
  index: number;
  /** How the tile slides when the order changes; `null` for none. */
  transition: UseSortableInput['transition'];
  selected: boolean;
  onToggle: () => void;
  onReady: (failed: boolean) => void;
  uploadStatus?: 'uploading' | 'ready' | 'failed';
  onRetry: () => void;
  className?: string;
}) {
  // The tile itself follows the pointer while dragged; a hidden copy of it keeps its slot in the grid.
  const { ref, isDragging } = useSortable({ id: item.id, index, transition });

  return (
    <div
      ref={ref}
      aria-label={item.name}
      className={cn(
        'group/tile focus-visible:ring-border-focused ring-offset-surface cursor-grab rounded-lg outline-none focus-visible:ring-(length:--ds-border-width-focused) focus-visible:ring-offset-(length:--ds-border-width-focused)',
        tileClassName,
        selected && 'border-border-input',
        isDragging && 'bg-surface-overlay shadow-overlay cursor-grabbing',
        className,
      )}
    >
      <MediaPreview item={item} selected={selected} onReady={onReady} />
      {uploadStatus === 'uploading' && (
        <div
          role="status"
          aria-live="polite"
          className="text-text-default pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/5 backdrop-blur"
        >
          <Spinner variant="spokes" />
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
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      )}
      <div
        aria-hidden="true"
        className={cn(
          'bg-interaction-hovered pointer-events-none absolute inset-0 opacity-0 transition-opacity',
          !selected && 'group-hover/tile:opacity-100',
        )}
      />
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        aria-label={`Select ${item.name}`}
        // Clicking or pressing Space on the checkbox must not start a drag.
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        className={cn(
          'not-data-checked:bg-background-input absolute top-2 left-2 size-4 cursor-pointer opacity-0 group-hover/tile:opacity-100 focus-visible:opacity-100 data-checked:opacity-100',
        )}
      />
    </div>
  );
}
