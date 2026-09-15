'use client';

import { Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { CreatePromptDialog } from './create-prompt-dialog';

export function CreatePromptButton() {
  const { businessId } = useParams<{ businessId: string }>();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Plus />
        Create Prompt
      </Button>
      <CreatePromptDialog
        businessId={businessId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
