'use client';

import { useEffect, useState } from 'react';

import type { Folder } from '@/types/api';

import { useCreateFolder } from '../api/create-folder';
import { getKnowledgeError } from '../api/knowledge-error';
import { useUpdateFolder } from '../api/update-folder';
import { useSelectedFolder } from '../hooks/use-selected-folder';

import { NameDialog } from './name-dialog';

const MAX_FOLDER_NAME_LENGTH = 100;

type FolderDialogProps = {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nest a new folder under this one. Ignored when renaming. */
  parentId?: string;
  /** Present when renaming an existing folder. */
  folder?: Folder;
};

export function FolderDialog({
  businessId,
  open,
  onOpenChange,
  parentId,
  folder,
}: FolderDialogProps) {
  const isRename = Boolean(folder);
  const [error, setError] = useState<string>();
  const { selectFolder } = useSelectedFolder(businessId);
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();

  useEffect(() => {
    if (open) setError(undefined);
  }, [open]);

  const handleSubmit = (name: string) => {
    setError(undefined);
    // The server rejects a duplicate name in the same parent with a 409 whose
    // message is already written for a person — show it on the field.
    const onError = (mutationError: unknown) =>
      setError(getKnowledgeError(mutationError));

    if (folder) {
      updateFolder.mutate(
        { businessId, folderId: folder.id, name },
        { onSuccess: () => onOpenChange(false), onError },
      );
      return;
    }

    createFolder.mutate(
      { businessId, name, parentId },
      {
        onSuccess: (created) => {
          // Creating a folder you then have to go and click is the wrong default.
          void selectFolder(created.id);
          onOpenChange(false);
        },
        onError,
      },
    );
  };

  return (
    <NameDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isRename ? 'Rename Folder' : 'New Folder'}
      submitLabel={isRename ? 'Rename' : 'Create'}
      initialName={folder?.name}
      placeholder="Customer Research"
      maxLength={MAX_FOLDER_NAME_LENGTH}
      requiredMessage="Folder name is required"
      isPending={createFolder.isPending || updateFolder.isPending}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
