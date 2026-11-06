'use client';

import { useRef } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { AddCategoryForm } from './add-category-form';

/** The quick-add dialog. Give it a `parentId` to start with that parent chosen. */
export function AddCategoryDialog({
  slug,
  open,
  onOpenChange,
  parentId,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  return (
    // A click outside would throw away what was typed, and could be mistaken for one on the parent picker's list.
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent
        ref={popupRef}
        className="sm:max-w-md"
        // Focus the dialog itself, not its first field.
        initialFocus={popupRef}
      >
        <DialogHeader>
          <DialogTitle>
            {parentId ? 'Add subcategory' : 'Add category'}
          </DialogTitle>
        </DialogHeader>
        <AddCategoryForm
          slug={slug}
          parentId={parentId}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
