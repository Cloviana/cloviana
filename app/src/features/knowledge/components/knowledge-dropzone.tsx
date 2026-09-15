'use client';

import { FileX } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import { UPLOAD_HINT, useDocumentUpload } from '../hooks/use-document-upload';
import { useSelectedFolder } from '../hooks/use-selected-folder';

import { FolderOpenedIcon } from './file-type-icons';

type KnowledgeDropzoneProps = {
  businessId: string;
  children: ReactNode;
};

/**
 * Wraps the table pane. The drop target stops at the folder rail so the dashed
 * frame outlines exactly the area that accepts a file.
 */
export function KnowledgeDropzone({
  businessId,
  children,
}: KnowledgeDropzoneProps) {
  const { folder } = useSelectedFolder(businessId);
  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDocumentUpload(businessId);

  // Deliberately not `isDragActive`: that fires for any drag, including a
  // document being dragged between folders, which must not raise the overlay.
  const isDroppingFiles = isDragAccept || isDragReject;

  return (
    <div
      {...getRootProps({
        className:
          'bg-surface relative flex min-h-0 flex-1 flex-col outline-none',
      })}
    >
      <input {...getInputProps()} />
      {children}

      {isDroppingFiles && (
        // pointer-events-none so the drop still lands on the root below.
        <div className="bg-background/60 pointer-events-none absolute inset-0 z-20 p-3 backdrop-blur-sm">
          {/* The dashed outline frames the whole page, not a card in the middle. */}
          <div
            className={cn(
              'flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed',
              isDragReject
                ? 'border-destructive bg-destructive/5'
                : 'border-primary bg-primary/5',
            )}
          >
            {isDragReject ? (
              <FileX className="text-destructive size-9" />
            ) : (
              <FolderOpenedIcon className="size-9" />
            )}
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">
                {isDragReject
                  ? 'That file type is not supported'
                  : `Drop to upload to ${folder?.name ?? 'this folder'}`}
              </p>
              <p className="text-muted-foreground text-xs">{UPLOAD_HINT}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
