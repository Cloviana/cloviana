'use client';

import {
  Folder as FolderIcon,
  FolderInput,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Document, Folder } from '@/types/api';

import { useDeleteDocument } from '../api/delete-document';
import { getKnowledgeError } from '../api/knowledge-error';
import { useUpdateDocument } from '../api/update-document';

import { DeleteDialog } from './delete-dialog';
import { RenameDocumentDialog } from './rename-document-dialog';

type DocumentActionsProps = {
  businessId: string;
  document: Document;
  folders: Folder[];
};

export function DocumentActions({
  businessId,
  document,
  folders,
}: DocumentActionsProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  // "Move to" is the real mechanism — dragging a row is only an accelerator,
  // and it is unavailable to keyboard and screen reader users.
  const moveTargets = folders.filter(
    (folder) => folder.id !== document.folderId,
  );

  const moveDocument = (folderId: string) =>
    updateDocument.mutate(
      { businessId, documentId: document.id, folderId },
      { onError: (error) => toast.error(getKnowledgeError(error)) },
    );

  const confirmDelete = () =>
    deleteDocument.mutate(
      { businessId, documentId: document.id },
      {
        onSuccess: () => setIsDeleteOpen(false),
        onError: (error) => {
          toast.error(getKnowledgeError(error));
          setIsDeleteOpen(false);
        },
      },
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${document.name}`}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={moveTargets.length === 0}>
              <FolderInput />
              Move to
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              {moveTargets.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onSelect={() => moveDocument(folder.id)}
                >
                  <FolderIcon />
                  <span className="truncate">{folder.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onSelect={() => setIsRenameOpen(true)}>
            <Pencil />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setIsDeleteOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameDocumentDialog
        businessId={businessId}
        document={document}
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
      />

      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={`Delete ${document.name}?`}
        description="This removes the document and everything indexed from it. It cannot be undone."
        isPending={deleteDocument.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
