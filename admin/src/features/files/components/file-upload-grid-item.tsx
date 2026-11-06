import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import { FileGridItem } from './file-grid-item';

export function FileUploadGridItem({
  file,
  status,
  onRetry,
}: {
  file: File;
  status: 'uploading' | 'failed';
  onRetry: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!preview)
    return (
      <div className="p-2">
        <Skeleton className="aspect-square w-full rounded-lg" />
      </div>
    );

  return (
    <FileGridItem
      file={{
        filename: file.name,
        url: preview,
        type: 'IMAGE',
        mimeType: file.type || null,
      }}
      selected={false}
      uploadStatus={status}
      onRetry={onRetry}
    />
  );
}
