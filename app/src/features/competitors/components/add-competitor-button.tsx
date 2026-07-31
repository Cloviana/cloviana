'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { AddCompetitorForm } from './add-competitor-form';

type AddCompetitorButtonProps = {
  businessId: string;
};

export function AddCompetitorButton({ businessId }: AddCompetitorButtonProps) {
  const [open, setOpen] = useState(false);

  function openSheet() {
    setOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Button size="sm" onClick={openSheet}>
        <Plus />
        Add competitor
      </Button>
      <SheetContent className="w-[28rem] max-w-[90vw] gap-0">
        <SheetHeader>
          <SheetTitle>Add competitor</SheetTitle>
        </SheetHeader>
        <AddCompetitorForm
          businessId={businessId}
          onCancel={() => setOpen(false)}
          onCreated={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
