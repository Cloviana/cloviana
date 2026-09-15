'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { FolderDialog } from './folder-dialog';

type NewFolderButtonProps = {
  businessId: string;
};

export function NewFolderButton({ businessId }: NewFolderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
        New Folder
      </Button>
      <FolderDialog
        businessId={businessId}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
