'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useDebouncedValue } from '@/hooks/use-debounced-value';

import { filePagesQueryOptions } from '../api/files-query-options';
import { useFileUploads } from '../hooks/use-file-uploads';
import type { FileAsset } from '../types/file';

export function useFileLibrary({
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
  const [selected, setSelected] = useState<Map<string, FileAsset>>(new Map());
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, FileAsset>>(
    new Map(),
  );
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const debouncedSearch = useDebouncedValue(term, 300);
  const isDebouncing = term !== debouncedSearch;
  const uploads = useFileUploads(slug);
  const sentinel = useRef<HTMLDivElement>(null);
  const {
    data,
    isPending,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    ...filePagesQueryOptions(slug, {
      type: 'IMAGE',
      query: debouncedSearch || undefined,
    }),
    enabled: open,
  });
  const files = Array.from(
    new Map(
      [
        ...Array.from(uploadedFiles.values()).filter(
          (file) =>
            !debouncedSearch ||
            file.filename?.toLowerCase().includes(debouncedSearch),
        ),
        ...(data?.pages.flatMap((page) => page.items) ?? []),
      ].map((file) => [file.id, file]),
    ).values(),
  );
  const selectedIds = new Set(selected.keys());
  const pendingUploads = Array.from(uploads.statuses).filter(
    (entry): entry is [File, 'uploading' | 'failed'] => entry[1] !== 'ready',
  );

  useEffect(() => {
    const target = sentinel.current;
    if (
      !target ||
      isDebouncing ||
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchNextPageError
    )
      return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void fetchNextPage();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [
    open,
    debouncedSearch,
    isDebouncing,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  ]);

  function toggle(id: string) {
    const file = files.find((item) => item.id === id);
    if (!file) return;
    setSelected((current) => {
      const next = new Map(current);
      if (!next.delete(id)) next.set(id, file);
      return next;
    });
  }

  function onUploadComplete(file: FileAsset) {
    setUploadedFiles((current) => new Map(current).set(file.id, file));
    setSelected((current) => new Map(current).set(file.id, file));
  }

  function addFiles(input: FileList) {
    const files = Array.from(input);
    const valid = files.filter(
      (file) =>
        file.type.startsWith('image/') &&
        file.size > 0 &&
        file.size <= 50 * 1024 * 1024,
    );
    if (valid.length !== files.length)
      toast.error('Choose images of 50 MB or less.');
    valid.forEach((file) => uploads.start(file, onUploadComplete));
  }

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen) {
      uploads.discard();
      setSelected(new Map());
      setUploadedFiles(new Map());
    }
    onOpenChange(nextOpen);
  }

  function confirmSelection() {
    onSelect(Array.from(selected.values()));
    changeOpen(false);
  }

  return {
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
    retryUpload: (file: File) => uploads.start(file, onUploadComplete),
    canConfirm:
      selected.size > 0 &&
      !pendingUploads.some(([, status]) => status === 'uploading'),
  };
}
