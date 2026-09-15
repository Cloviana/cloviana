'use client';

import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { getKnowledgeError } from '../api/knowledge-error';
import { useUploadDocuments } from '../api/upload-documents';

import { useSelectedFolder } from './use-selected-folder';

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

/** One source of truth for the limits, shared by the toast and the drop overlay. */
export const UPLOAD_HINT = `PDF, DOCX, Markdown, or TXT · up to ${MAX_FILES} files, ${MAX_FILE_SIZE / 1024 / 1024} MB each`;

/**
 * Uploading into the selected folder. Shared by the header button and the
 * drop target so the accepted types and limits can't drift apart — the button
 * passes `noDrag`, the pane passes nothing.
 */
export function useDocumentUpload(
  businessId: string,
  { noDrag = false }: { noDrag?: boolean } = {},
) {
  const { folder } = useSelectedFolder(businessId);
  const uploadDocuments = useUploadDocuments();

  const dropzone = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: MAX_FILES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    noClick: true,
    noKeyboard: true,
    noDrag,
    disabled: !folder || uploadDocuments.isPending,
    onDropAccepted: (files) => {
      if (!folder || files.length === 0) return;
      uploadDocuments.mutate(
        { businessId, folderId: folder.id, files },
        {
          onSuccess: () =>
            toast.success(
              `${files.length} ${files.length === 1 ? 'document' : 'documents'} uploaded`,
            ),
          onError: (error) =>
            toast.error(getKnowledgeError(error, 'Could not upload documents')),
        },
      );
    },
    onDropRejected: () => toast.error(`Could not upload — ${UPLOAD_HINT}.`),
  });

  return {
    ...dropzone,
    isUploadDisabled: !folder,
    isUploading: uploadDocuments.isPending,
  };
}
