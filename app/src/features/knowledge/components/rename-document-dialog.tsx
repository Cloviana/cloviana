'use client';

import { useEffect, useState } from 'react';

import type { Document } from '@/types/api';

import { getKnowledgeError } from '../api/knowledge-error';
import { useUpdateDocument } from '../api/update-document';

import { NameDialog } from './name-dialog';

const MAX_DOCUMENT_NAME_LENGTH = 255;

type RenameDocumentDialogProps = {
  businessId: string;
  document: Document;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RenameDocumentDialog({
  businessId,
  document,
  open,
  onOpenChange,
}: RenameDocumentDialogProps) {
  const [error, setError] = useState<string>();
  const updateDocument = useUpdateDocument();

  useEffect(() => {
    if (open) setError(undefined);
  }, [open]);

  const handleSubmit = (name: string) => {
    // Nothing changed — close without spending a request.
    if (name === document.name) {
      onOpenChange(false);
      return;
    }

    setError(undefined);
    updateDocument.mutate(
      { businessId, documentId: document.id, name },
      {
        onSuccess: () => onOpenChange(false),
        onError: (mutationError) => setError(getKnowledgeError(mutationError)),
      },
    );
  };

  return (
    <NameDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Rename Document"
      submitLabel="Rename"
      initialName={document.name}
      maxLength={MAX_DOCUMENT_NAME_LENGTH}
      requiredMessage="Document name is required"
      isPending={updateDocument.isPending}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
