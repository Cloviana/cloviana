'use client';

import { useIsMutating } from '@tanstack/react-query';
import { AlertCircle, UploadCloud } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getKnowledgeError } from '@/features/knowledge/api/knowledge-error';
import { useUploadDocuments } from '@/features/knowledge/api/upload-documents';
import type { Document, Folder } from '@/types/api';
import { cn } from '@/utils/cn';

import { DocumentsEmptyState } from './documents-empty-state';
import { DocumentsList } from './documents-list';
import { FolderDetailHeader } from './folder-detail-header';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
  'text/markdown': ['.md', '.markdown'],
  'text/plain': ['.txt'],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

type FolderDetailProps = {
  businessId: string;
  folder?: Folder;
  folders: Folder[];
  documents: Document[];
  isLoading?: boolean;
  isDocumentsLoading?: boolean;
  documentsError?: Error | null;
  isRetryingDocuments?: boolean;
  onSelectFolder: (folderId: string) => void;
  onFolderDeleted: () => void;
  onRetryDocuments: () => void;
};

export function FolderDetail({
  businessId,
  folder,
  folders,
  documents,
  isLoading = false,
  isDocumentsLoading = false,
  documentsError,
  isRetryingDocuments = false,
  onSelectFolder,
  onFolderDeleted,
  onRetryDocuments,
}: FolderDetailProps) {
  const uploadDocuments = useUploadDocuments();
  const structureMutationCount = useIsMutating({
    mutationKey: ['knowledge', 'structure', businessId],
    exact: true,
  });
  const uploadDisabled =
    !folder ||
    isLoading ||
    isDocumentsLoading ||
    Boolean(documentsError) ||
    uploadDocuments.isPending ||
    structureMutationCount > 0;
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    open: openFilePicker,
  } = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: MAX_FILES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    noClick: true,
    noKeyboard: true,
    disabled: uploadDisabled,
    onDropAccepted: (files) => {
      if (!folder || files.length === 0) return;
      uploadDocuments.mutate(
        { businessId, folderId: folder.id, files },
        {
          onSuccess: () => {
            toast.success(
              `${files.length} ${files.length === 1 ? 'document' : 'documents'} uploaded`,
            );
          },
          onError: (error) => {
            toast.error(getKnowledgeError(error, 'Could not upload documents'));
          },
        },
      );
    },
    onDropRejected: () => {
      toast.error(
        'Upload up to 5 PDF, DOCX, Markdown, or TXT files of 5 MB or less.',
      );
    },
  });

  return (
    <main
      {...getRootProps({
        className: cn(
          'relative min-h-[20rem] min-w-0 flex-1 outline-none md:min-h-0',
          isDragActive && 'bg-primary/5',
        ),
      })}
    >
      <input
        {...getInputProps({
          'aria-label': `Upload documents${folder ? ` to ${folder.name}` : ''}`,
        })}
      />

      {isDragActive && (
        <div
          className={cn(
            'bg-background/90 pointer-events-none absolute inset-3 z-30 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed backdrop-blur-sm',
            isDragReject ? 'border-destructive' : 'border-primary',
          )}
        >
          <UploadCloud
            className={cn(
              'size-6',
              isDragReject ? 'text-destructive' : 'text-primary',
            )}
          />
          <p className="text-sm font-medium">
            {isDragReject
              ? 'These files cannot be uploaded'
              : `Drop files into ${folder?.name ?? 'this folder'}`}
          </p>
          <p className="text-muted-foreground text-xs">
            PDF, DOCX, Markdown, or TXT · 5 MB maximum
          </p>
        </div>
      )}

      <div className="flex h-full min-h-0 flex-1 flex-col">
        {isLoading || !folder ? (
          <div className="space-y-3 border-b px-6 py-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-64" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        ) : (
          <FolderDetailHeader
            businessId={businessId}
            folder={folder}
            folders={folders}
            documentCount={folder._count.documents}
            onSelectFolder={onSelectFolder}
            onUpload={openFilePicker}
            isUploading={uploadDocuments.isPending}
            uploadDisabled={uploadDisabled}
            actionsDisabled={uploadDocuments.isPending}
            onDeleted={onFolderDeleted}
          />
        )}

        {isLoading || !folder ? (
          <div className="space-y-2 p-6">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-12 w-full" />
            ))}
          </div>
        ) : documentsError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <AlertCircle className="text-destructive size-5" />
            <div>
              <p className="text-sm font-medium">Could not load documents</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Check your connection and try again.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              loading={isRetryingDocuments}
              onClick={onRetryDocuments}
            >
              Try again
            </Button>
          </div>
        ) : isDocumentsLoading ? (
          <div className="space-y-2 p-6">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-12 w-full" />
            ))}
          </div>
        ) : documents.length > 0 ? (
          <DocumentsList
            businessId={businessId}
            documents={documents}
            actionsDisabled={uploadDocuments.isPending}
          />
        ) : (
          <DocumentsEmptyState
            onUpload={openFilePicker}
            isUploading={uploadDocuments.isPending}
            uploadDisabled={uploadDisabled}
          />
        )}
      </div>
    </main>
  );
}
