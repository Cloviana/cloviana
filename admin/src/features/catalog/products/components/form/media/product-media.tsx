'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { FieldSet, FieldLabel, FieldError } from '@/components/ui/field';
import { useFileDrop } from '@/components/ui/file-dropzone';
import { FileLibraryDialog } from '@/features/files';
import type { FileUploads } from '@/features/files';

import type { ProductFormValues } from '../use-product-form';

import { MediaDropzone } from './media-dropzone';
import { MediaGrid } from './media-grid';
import { MediaSelectionBar } from './media-selection-bar';
import { useMediaItems } from './use-media-items';
import { useMediaSelection } from './use-media-selection';

// Product images: upload, reorder, select and remove.
// Files are mirrored into the form while uploads run in the background.
export function ProductMedia({
  slug,
  uploads,
}: {
  slug: string;
  uploads: FileUploads;
}) {
  const mediaId = useId();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const { control, getValues, setValue } = useFormContext<ProductFormValues>();
  const {
    items,
    addFiles,
    addExisting,
    markReady,
    remove,
    reorder,
    restoreOrder,
  } = useMediaItems(
    getValues('media') ?? [],
    uploads.start,
    uploads.remove,
    uploads.getAssetId,
  );
  const selection = useMediaSelection(items);
  const fileDrop = useFileDrop(addFiles);

  const firstSync = useRef(true);
  useEffect(() => {
    if (firstSync.current) {
      firstSync.current = false;
      return;
    }
    setValue(
      'media',
      items.map((item) => item.source),
      { shouldDirty: true, shouldValidate: true },
    );
  }, [items, setValue]);

  return (
    <Controller
      control={control}
      name="media"
      render={({ field, fieldState }) => (
        <FieldSet
          ref={field.ref}
          tabIndex={-1}
          data-invalid={fieldState.invalid}
          aria-describedby={fieldState.invalid ? `${mediaId}-error` : undefined}
          role="group"
          aria-label="Media"
          // The grid sizes its rows from this container's width.
          className="@container w-full min-w-0 gap-2"
        >
          {selection.selected.size > 0 ? (
            <MediaSelectionBar
              count={selection.selected.size}
              allSelected={selection.allSelected}
              onToggleAll={selection.toggleAll}
              onRemove={() => {
                remove(selection.selected);
                selection.clear();
              }}
            />
          ) : (
            <FieldLabel
              htmlFor={items.length === 0 ? mediaId : undefined}
              className="min-h-5"
            >
              Media
            </FieldLabel>
          )}

          {items.length === 0 ? (
            <MediaDropzone
              slug={slug}
              id={mediaId}
              name={field.name}
              invalid={fieldState.invalid}
              onBlur={field.onBlur}
              onFiles={addFiles}
              onSelectExisting={addExisting}
            />
          ) : (
            <>
              <MediaGrid
                items={items}
                selected={selection.selected}
                onToggle={selection.toggle}
                onReady={markReady}
                uploadStatuses={uploads.statuses}
                onRetry={uploads.start}
                onReorder={reorder}
                onRestoreOrder={restoreOrder}
                onOpenLibrary={() => setLibraryOpen(true)}
                isOver={fileDrop.isOver}
                dropProps={fileDrop.dropProps}
              />
              <FileLibraryDialog
                slug={slug}
                open={libraryOpen}
                onOpenChange={setLibraryOpen}
                onSelect={addExisting}
              />
            </>
          )}
          <FieldError id={`${mediaId}-error`} errors={[fieldState.error]} />
        </FieldSet>
      )}
    />
  );
}
