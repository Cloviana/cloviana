import { Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';

type DocumentsEmptyStateProps = {
  onUpload: () => void;
  isUploading?: boolean;
  uploadDisabled?: boolean;
};

export function DocumentsEmptyState({
  onUpload,
  isUploading = false,
  uploadDisabled = false,
}: DocumentsEmptyStateProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
      <div className="border-border flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center">
        <p className="text-sm font-medium">No documents in this folder</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Upload text files to index them for agent retrieval. Documents in
          subfolders are listed under those folders.
        </p>
        <Button
          className="h-8 gap-1.5 px-2.5"
          onClick={onUpload}
          loading={isUploading}
          disabled={uploadDisabled}
        >
          <Upload />
          Upload documents
        </Button>
      </div>
    </div>
  );
}
