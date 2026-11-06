'use client';

import { PlusIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';

import { AddCategoryDialog } from '../dialogs/add-category-dialog';

export function AddCategoryButton({ size }: Pick<ButtonProps, 'size'>) {
  const { slug } = useParams<{ slug: string }>();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        <PlusIcon />
        Add category
      </Button>
      <AddCategoryDialog slug={slug} open={open} onOpenChange={setOpen} />
    </>
  );
}
