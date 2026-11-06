'use client';

import { EllipsisIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { paths } from '@/config/paths';

import type { Category } from '../../types';
import { AddCategoryDialog } from '../dialogs/add-category-dialog';
import { DeleteCategoryDialog } from '../dialogs/delete-category-dialog';

/** The row's actions: edit the category, add a category under it, or delete it with its subcategories. */
export function CategoryRowActions({
  slug,
  category,
}: {
  slug: string;
  category: Category;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const openingDialog = useRef(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${category.name}`}
          >
            <EllipsisIcon aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56"
          // The dialog takes focus itself, so the menu must not hand it back to its trigger.
          onCloseAutoFocus={(event) => {
            if (!openingDialog.current) return;
            openingDialog.current = false;
            event.preventDefault();
          }}
        >
          <DropdownMenuItem
            onSelect={() =>
              router.push(paths.mp.categories.edit.getHref(slug, category.id))
            }
          >
            <PencilIcon aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              openingDialog.current = true;
              setAdding(true);
            }}
          >
            <PlusIcon aria-hidden="true" />
            Add subcategory
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              openingDialog.current = true;
              setDeleting(true);
            }}
          >
            <Trash2Icon aria-hidden="true" />
            Delete category
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AddCategoryDialog
        slug={slug}
        open={adding}
        onOpenChange={setAdding}
        parentId={category.id}
      />
      <DeleteCategoryDialog
        slug={slug}
        category={category}
        open={deleting}
        onOpenChange={setDeleting}
      />
    </>
  );
}
