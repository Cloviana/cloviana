import { useState, type FocusEvent } from 'react';

import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/ui/file-dropzone';
import { FileLibraryDialog } from '@/features/files';
import type { FileAsset } from '@/features/files';

import { ACCEPTED_MEDIA, MAX_MEDIA } from './media';

export function MediaDropzone({
  slug,
  id,
  name,
  invalid,
  onBlur,
  onFiles,
  onSelectExisting,
}: {
  slug: string;
  id: string;
  name: string;
  invalid: boolean;
  onBlur: (event: FocusEvent<HTMLInputElement>) => void;
  onFiles: (files: FileList) => void;
  onSelectExisting: (files: FileAsset[]) => void;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <FileDropzone
      id={id}
      name={name}
      invalid={invalid}
      onBlur={onBlur}
      accept={ACCEPTED_MEDIA}
      multiple
      onFilesSelected={onFiles}
    >
      {({ openFileDialog, isOver }) =>
        isOver ? (
          <p className="text-body font-medium">Drop files to upload</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openFileDialog}
              >
                Upload new
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLibraryOpen(true)}
              >
                Select existing
              </Button>
              <FileLibraryDialog
                slug={slug}
                open={libraryOpen}
                onOpenChange={setLibraryOpen}
                onSelect={onSelectExisting}
              />
            </div>
            <p className="text-text-subtlest text-body-small">
              Add up to {MAX_MEDIA} images, such as JPG, PNG or WebP. Drag and
              drop to upload.
            </p>
          </>
        )
      }
    </FileDropzone>
  );
}
