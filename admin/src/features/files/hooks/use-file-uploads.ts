'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import {
  completeFileUploadAction,
  prepareFileUploadAction,
} from '@/features/files/actions/file-upload';
import { fileKeys } from '@/features/files/api/files-query-options';
import { uploadFileBytes } from '@/features/files/api/upload-file-bytes';
import type { FileAsset } from '@/features/files/types/file';

type UploadStatus = 'uploading' | 'ready' | 'failed';
type UploadEntry = {
  controller: AbortController;
  status: UploadStatus;
  uploadId?: string;
  uploaded?: boolean;
  asset?: FileAsset;
  promise: Promise<void>;
};

export function useFileUploads(slug: string) {
  const queryClient = useQueryClient();
  const entries = useRef(new Map<File, UploadEntry>());
  const [statuses, setStatuses] = useState(new Map<File, UploadStatus>());

  function setStatus(file: File, entry: UploadEntry, status: UploadStatus) {
    if (entries.current.get(file) !== entry) return;
    entry.status = status;
    setStatuses((current) => new Map(current).set(file, status));
  }

  function start(file: File, onComplete?: (asset: FileAsset) => void) {
    const previous = entries.current.get(file);
    if (previous) {
      previous.controller.abort();
    }
    const entry: UploadEntry = {
      controller: new AbortController(),
      status: 'uploading',
      promise: Promise.resolve(),
      uploadId: previous?.uploaded ? previous.uploadId : undefined,
      uploaded: previous?.uploaded,
    };
    entries.current.set(file, entry);
    setStatuses((current) => new Map(current).set(file, 'uploading'));
    entry.promise = (async () => {
      try {
        if (!entry.uploaded) {
          const upload = await prepareFileUploadAction(slug, {
            filename: file.name,
            contentType: file.type,
            size: file.size,
          });
          entry.uploadId = upload.uploadId;
          if (entry.controller.signal.aborted) return;
          await uploadFileBytes(
            upload.url,
            upload.contentType,
            file,
            entry.controller.signal,
          );
          entry.uploaded = true;
        }
        const asset = await completeFileUploadAction(slug, {
          uploadId: entry.uploadId!,
          filename: file.name,
        });
        entry.asset = asset;
        void queryClient.invalidateQueries({ queryKey: fileKeys.all(slug) });
        if (
          !entry.controller.signal.aborted &&
          entries.current.get(file) === entry
        ) {
          setStatus(file, entry, 'ready');
          onComplete?.(asset);
        }
      } catch {
        if (!entry.controller.signal.aborted) setStatus(file, entry, 'failed');
      }
    })();
  }

  function remove(file: File) {
    const entry = entries.current.get(file);
    if (!entry) return;
    entries.current.delete(file);
    entry.controller.abort();
    setStatuses((current) => {
      const next = new Map(current);
      next.delete(file);
      return next;
    });
  }

  function discard() {
    for (const entry of entries.current.values()) {
      entry.controller.abort();
    }
    entries.current.clear();
    setStatuses(new Map());
  }

  function forget() {
    entries.current.clear();
    setStatuses(new Map());
  }

  async function waitForUploads(files: File[]): Promise<FileAsset[] | null> {
    const selected = files.map((file) => entries.current.get(file));
    await Promise.all(selected.map((entry) => entry?.promise));
    if (
      selected.some(
        (entry, index) =>
          !entry ||
          entries.current.get(files[index]) !== entry ||
          entry.status !== 'ready' ||
          !entry.asset,
      )
    )
      return null;
    return selected.map((entry) => entry!.asset!);
  }

  useEffect(() => {
    const active = entries.current;
    return () => {
      for (const entry of active.values()) {
        entry.controller.abort();
      }
      active.clear();
    };
    // The marketplace is fixed for the lifetime of this form.
  }, []);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: fileKeys.all(slug) });
  }

  function getAssetId(file: File) {
    return entries.current.get(file)?.asset?.id;
  }

  return {
    statuses,
    start,
    remove,
    discard,
    forget,
    waitForUploads,
    refresh,
    getAssetId,
  };
}

export type FileUploads = ReturnType<typeof useFileUploads>;
