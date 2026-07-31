'use client';

import {
  EllipsisVertical,
  FolderPlus,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteFolder } from '@/features/knowledge/api/delete-folder';
import { getKnowledgeError } from '@/features/knowledge/api/knowledge-error';
import type { Folder } from '@/types/api';

import { FolderDialog } from './folder-dialog';

type FolderActionsProps = {
  businessId: string;
  folder: Folder;
  onUpload: () => void;
  onRename: () => void;
  isUploading?: boolean;
  uploadDisabled?: boolean;
  actionsDisabled?: boolean;
  onDeleted: () => void;
};

export function FolderActions({
  businessId,
  folder,
  onUpload,
  onRename,
  isUploading = false,
  uploadDisabled = false,
  actionsDisabled = false,
  onDeleted,
}: FolderActionsProps) {
  const [subfolderOpen, setSubfolderOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteFolder = useDeleteFolder();
  const isEmpty = folder._count.children === 0 && folder._count.documents === 0;

  async function handleDelete() {
    if (deleteFolder.isPending) return;
    try {
      await deleteFolder.mutateAsync({ businessId, folderId: folder.id });
      toast.success('Folder deleted');
      setDeleteOpen(false);
      onDeleted();
    } catch (error) {
      toast.error(getKnowledgeError(error, 'Could not delete folder'));
    }
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onUpload}
          loading={isUploading}
          disabled={uploadDisabled || actionsDisabled}
          className="h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem]"
        >
          <Upload />
          Upload
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Folder actions"
              className="text-muted-foreground size-7 rounded-[min(var(--radius-md),12px)]"
              disabled={actionsDisabled}
            >
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => setSubfolderOpen(true)}>
              <FolderPlus className="size-4" />
              New subfolder
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onRename}>
              <Pencil className="size-4" />
              Rename folder
            </DropdownMenuItem>
            {!folder.isDefault && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={!isEmpty}
                  title={
                    isEmpty ? undefined : 'Only empty folders can be deleted'
                  }
                  onSelect={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete folder
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <FolderDialog
        businessId={businessId}
        parentId={folder.id}
        open={subfolderOpen}
        onOpenChange={setSubfolderOpen}
      />

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleteFolder.isPending) setDeleteOpen(open);
        }}
      >
        <DialogContent
          showCloseButton={!deleteFolder.isPending}
          onEscapeKeyDown={(event) => {
            if (deleteFolder.isPending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (deleteFolder.isPending) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete “{folder.name}”?</DialogTitle>
            <DialogDescription>
              This permanently removes the empty folder. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteFolder.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteFolder.isPending}
              onClick={handleDelete}
            >
              Delete folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
