'use client';

import { type FormEvent, useEffect, useId, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateFolder } from '@/features/knowledge/api/create-folder';
import { getKnowledgeError } from '@/features/knowledge/api/knowledge-error';

type FolderDialogProps = {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string;
};

export function FolderDialog({
  businessId,
  open,
  onOpenChange,
  parentId,
}: FolderDialogProps) {
  const inputId = useId();
  const [name, setName] = useState('');
  const createFolder = useCreateFolder();
  const isPending = createFolder.isPending;

  useEffect(() => {
    if (open) setName('');
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim().replace(/\s+/g, ' ');
    if (!normalizedName || isPending) return;

    createFolder.mutate(
      { businessId, name: normalizedName, parentId },
      {
        onSuccess: () => {
          toast.success('Folder created');
          onOpenChange(false);
        },
        onError: (error: Error) => {
          toast.error(getKnowledgeError(error, 'Could not create folder'));
        },
      },
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!isPending) onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isPending}
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <form
          onSubmit={handleSubmit}
          aria-busy={isPending || undefined}
          className="space-y-5"
        >
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>
            <DialogDescription>
              {parentId
                ? 'Create a subfolder inside the selected folder.'
                : 'Create a folder to organise related knowledge sources.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={inputId}>Name</Label>
            <Input
              id={inputId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              autoFocus
              disabled={isPending}
              placeholder="e.g. Customer research"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending} disabled={!name.trim()}>
              Create folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
