'use client';

import { SearchIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { FileDropzone } from '@/components/ui/file-dropzone';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';

import type { FileAsset } from '../types/file';

import { FileGrid } from './file-grid';
import { FileGridSkeleton } from './file-grid-skeleton';
import { useFileLibrary } from './use-file-library';

export function FileLibraryDialog({
  slug,
  open,
  onOpenChange,
  onSelect,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (files: FileAsset[]) => void;
}) {
  const {
    search,
    setSearch,
    debouncedSearch,
    isDebouncing,
    files,
    selectedIds,
    pendingUploads,
    sentinel,
    data,
    isPending,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    toggle,
    addFiles,
    changeOpen,
    confirmSelection,
    retryUpload,
    canConfirm,
  } = useFileLibrary({ slug, open, onOpenChange, onSelect });

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        aria-describedby={undefined}
        className="flex h-[min(80dvh,48rem)] w-[calc(100%-2rem)] flex-col sm:max-w-5xl"
      >
        <DialogHeader>
          <DialogTitle>Select file</DialogTitle>
        </DialogHeader>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Search files"
            placeholder="Search files"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={100}
          />
        </InputGroup>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <FileDropzone
            accept="image/*"
            multiple
            onFilesSelected={addFiles}
            className="mb-4"
          >
            {({ openFileDialog, isOver }) =>
              isOver ? (
                <p className="text-body font-medium">Drop files to upload</p>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openFileDialog}
                  >
                    Upload new
                  </Button>
                  <p className="text-text-subtlest text-body-small text-center">
                    Choose images or drag and drop them here.
                  </p>
                </>
              )
            }
          </FileDropzone>
          {(isDebouncing || isPending) &&
          files.length === 0 &&
          pendingUploads.length === 0 ? (
            <FileGridSkeleton />
          ) : isError &&
            !data &&
            files.length === 0 &&
            pendingUploads.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Could not load files</EmptyTitle>
                <EmptyDescription>Please try again.</EmptyDescription>
              </EmptyHeader>
              <Button
                type="button"
                variant="outline"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </Empty>
          ) : files.length === 0 && pendingUploads.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>
                  {debouncedSearch ? 'No files found' : 'No files yet'}
                </EmptyTitle>
                <EmptyDescription>
                  {debouncedSearch
                    ? 'Try a different search.'
                    : 'Uploaded images will appear here.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <FileGrid
                files={files}
                selected={selectedIds}
                onToggle={toggle}
                pendingUploads={pendingUploads}
                onRetry={retryUpload}
              />
              {hasNextPage && (
                <div ref={sentinel} className="flex justify-center p-4">
                  {isFetchingNextPage ? (
                    <Spinner aria-label="Loading more files" />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void fetchNextPage()}
                    >
                      {isFetchNextPageError
                        ? 'Retry loading files'
                        : 'Load more'}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" size="sm" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            disabled={!canConfirm}
            onClick={confirmSelection}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
