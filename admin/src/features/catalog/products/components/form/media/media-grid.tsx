import {
  Accessibility,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  Feedback,
  PointerActivationConstraints,
  PointerSensor,
} from '@dnd-kit/dom';
import { DragDropProvider } from '@dnd-kit/react';
import { PlusIcon } from 'lucide-react';
import { type ComponentProps, useEffect, useMemo, useRef } from 'react';

import type { FileDropProps } from '@/components/ui/file-dropzone';

import { MAX_MEDIA, type MediaItem } from './media';
import { SortableMediaTile } from './media-tile';
import type { ReorderEvent } from './use-media-items';
import { useSortMotion } from './use-sort-motion';

type ProviderProps = ComponentProps<typeof DragDropProvider>;

// A small threshold so a plain click (e.g. on a checkbox) is not a drag; touch waits, so the page can still scroll.
const sensors: ProviderProps['sensors'] = (defaults) => [
  ...defaults.filter((sensor) => sensor !== PointerSensor),
  PointerSensor.configure({
    activationConstraints: (event) =>
      event.pointerType === 'touch'
        ? [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })]
        : [new PointerActivationConstraints.Distance({ value: 5 })],
  }),
];

// The tiles once there is media: drag to reorder, "+" to add more.
export function MediaGrid({
  items,
  selected,
  onToggle,
  onReady,
  uploadStatuses,
  onRetry,
  onReorder,
  onRestoreOrder,
  onOpenLibrary,
  isOver,
  dropProps,
}: {
  items: MediaItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onReady: (id: string, failed: boolean) => void;
  uploadStatuses: Map<File, 'uploading' | 'ready' | 'failed'>;
  onRetry: (file: File) => void;
  onReorder: (event: ReorderEvent) => void;
  onRestoreOrder: (order: string[]) => void;
  onOpenLibrary: () => void;
  isOver: boolean;
  dropProps: FileDropProps;
}) {
  const motion = useSortMotion();
  // Order before the current drag, restored if it is cancelled.
  const orderBeforeDrag = useRef<string[]>([]);
  // The announcements read the latest items without making the plugins change (they must stay the same while dragging).
  const latestItems = useRef(items);
  useEffect(() => {
    latestItems.current = items;
  });

  const plugins = useMemo<ProviderProps['plugins']>(() => {
    const nameOf = (id: string | number) =>
      latestItems.current.find((item) => item.id === id)?.name ?? 'image';
    return (defaults) => [
      ...defaults.filter(
        (plugin) => plugin !== Accessibility && plugin !== Feedback,
      ),
      // The default announcements would read out the tile's id.
      Accessibility.configure({
        announcements: {
          dragstart: ({ operation: { source } }: DragStartEvent) =>
            source ? `Picked up ${nameOf(source.id)}.` : undefined,
          dragover: ({ operation: { source, target } }: DragOverEvent) => {
            if (!source || !target) return undefined;
            const position =
              latestItems.current.findIndex((item) => item.id === target.id) +
              1;
            return position > 0
              ? `${nameOf(source.id)} moved to position ${position} of ${latestItems.current.length}.`
              : undefined;
          },
          dragend: ({ canceled, operation: { source } }: DragEndEvent) => {
            if (!source) return undefined;
            return canceled
              ? `Reordering cancelled. ${nameOf(source.id)} went back to its place.`
              : `${nameOf(source.id)} dropped.`;
          },
        },
      }),
      Feedback.configure({ dropAnimation: motion.dropAnimation }),
    ];
  }, [motion.dropAnimation]);

  return (
    <DragDropProvider
      sensors={sensors}
      plugins={plugins}
      onDragStart={() => {
        orderBeforeDrag.current = items.map((item) => item.id);
      }}
      // Reorder live while dragging so tiles (and the large first slot)
      // reflow under the pointer; the tiles animate their own moves.
      onDragOver={onReorder}
      onDragEnd={(event) => {
        if (event.canceled) onRestoreOrder(orderBeforeDrag.current);
      }}
    >
      <div
        {...dropProps}
        // 6 columns x 2 rows across the full width: the first item takes 2x2
        // on the left, the other 8 fill 4 per row, top row first. A row is
        // one column wide (container width minus 5 gaps, / 6) so tiles stay
        // square; the parent must be an @container. Subtract the five token gaps.
        className="relative grid grid-cols-6 grid-rows-[repeat(2,calc((100cqw-(--spacing(2))*5)/6))] gap-2"
      >
        {isOver && (
          <div className="bg-surface-overlay text-text-selected border-border-selected border-line pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg">
            <p className="text-body font-medium">Drop files to upload</p>
          </div>
        )}
        {items.map((item, index) => (
          <SortableMediaTile
            key={item.id}
            item={item}
            index={index}
            transition={motion.transition}
            selected={selected.has(item.id)}
            onToggle={() => onToggle(item.id)}
            onReady={(failed) => onReady(item.id, failed)}
            uploadStatus={
              item.source instanceof File
                ? uploadStatuses.get(item.source)
                : undefined
            }
            onRetry={() => {
              if (item.source instanceof File) onRetry(item.source);
            }}
            className={index === 0 ? 'col-span-2 row-span-2' : undefined}
          />
        ))}
        {items.length < MAX_MEDIA && (
          <button
            type="button"
            aria-label="Add media"
            // Adding while some media is selected would be confusing.
            disabled={selected.size > 0}
            onClick={onOpenLibrary}
            className="bg-background-neutral-subtle border-border-default enabled:hover:bg-background-neutral-subtle-hovered enabled:active:bg-background-neutral-subtle-pressed focus-visible:border-border-focused focus-visible:ring-border-focused ring-offset-surface disabled:text-icon-disabled disabled:border-border-disabled disabled:bg-background-disabled border-line flex items-center justify-center rounded-lg border-dashed outline-none focus-visible:ring-(length:--ds-border-width-focused) focus-visible:ring-offset-(length:--ds-border-width-focused) disabled:pointer-events-none"
          >
            <PlusIcon className="size-4" />
          </button>
        )}
      </div>
    </DragDropProvider>
  );
}
