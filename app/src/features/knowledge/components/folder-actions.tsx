'use client';

import { FolderPlus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Folder } from '@/types/api';

import { useDeleteFolder } from '../api/delete-folder';
import { getKnowledgeError } from '../api/knowledge-error';
import { useSelectedFolder } from '../hooks/use-selected-folder';

import { DeleteDialog } from './delete-dialog';
import { FolderDialog } from './folder-dialog';

type FolderActionsProps = {
  businessId: string;
  folder: Folder;
  className?: string;
};

export function FolderActions({
  businessId,
  folder,
  className,
}: FolderActionsProps) {
  const [isSubfolderOpen, setIsSubfolderOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const {
    folder: selectedFolder,
    folders,
    selectFolder,
  } = useSelectedFolder(businessId);
  const deleteFolder = useDeleteFolder();

  const confirmDelete = () =>
    deleteFolder.mutate(
      { businessId, folderId: folder.id },
      {
        onSuccess: () => {
          setIsDeleteOpen(false);
          // Only move if the folder being viewed is the one that just went away.
          if (selectedFolder?.id === folder.id) {
            const parent = folders.find((item) => item.id === folder.parentId);
            if (parent) void selectFolder(parent.id);
          }
        },
        // 409 for the default folder, a non-empty one, or one mid-deletion.
        onError: (error) => toast.error(getKnowledgeError(error)),
      },
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-xs"
            variant="ghost"
            className={className}
            aria-label={`Actions for ${folder.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => setIsSubfolderOpen(true)}>
            <FolderPlus />
            New subfolder
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={folder.isDefault}
            onSelect={() => setIsRenameOpen(true)}
          >
            <Pencil />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={folder.isDefault}
            onSelect={() => setIsDeleteOpen(true)}
          >
            <Trash2 />
            Delete folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FolderDialog
        businessId={businessId}
        open={isSubfolderOpen}
        onOpenChange={setIsSubfolderOpen}
        parentId={folder.id}
      />
      <FolderDialog
        businessId={businessId}
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        folder={folder}
      />
      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={`Delete ${folder.name}?`}
        description="Only empty folders can be deleted. Everything indexed from it is removed."
        confirmLabel="Delete folder"
        isPending={deleteFolder.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
