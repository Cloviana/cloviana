import { useRef } from 'react';

import { ItemGroup } from '@/components/ui/item';

import type { FileAsset } from '../types/file';

import { FileGridItem } from './file-grid-item';
import { FileUploadGridItem } from './file-upload-grid-item';

export function FileGrid({
  files,
  selected,
  onToggle,
  pendingUploads,
  onRetry,
}: {
  files: FileAsset[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  pendingUploads: [File, 'uploading' | 'failed'][];
  onRetry: (file: File) => void;
}) {
  const keys = useRef(new WeakMap<File, string>());

  function uploadKey(file: File) {
    let key = keys.current.get(file);
    if (!key) {
      key = crypto.randomUUID();
      keys.current.set(file, key);
    }
    return key;
  }

  return (
    <ItemGroup
      aria-label="Files"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
    >
      {pendingUploads.map(([file, status]) => (
        <FileUploadGridItem
          key={uploadKey(file)}
          file={file}
          status={status}
          onRetry={() => onRetry(file)}
        />
      ))}
      {files.map((file) => (
        <FileGridItem
          key={file.id}
          file={file}
          selected={selected.has(file.id)}
          onToggle={() => onToggle(file.id)}
        />
      ))}
    </ItemGroup>
  );
}
