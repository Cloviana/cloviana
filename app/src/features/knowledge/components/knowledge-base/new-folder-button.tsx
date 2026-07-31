'use client';

import { useIsMutating } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { FolderDialog } from './folder-dialog';

type NewFolderButtonProps = {
  businessId: string;
};

export function NewFolderButton({ businessId }: NewFolderButtonProps) {
  const [open, setOpen] = useState(false);
  const structureMutationCount = useIsMutating({
    mutationKey: ['knowledge', 'structure', businessId],
    exact: true,
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={structureMutationCount > 0}
        onClick={() => setOpen(true)}
      >
        <Plus />
        New folder
      </Button>
      <FolderDialog
        businessId={businessId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
