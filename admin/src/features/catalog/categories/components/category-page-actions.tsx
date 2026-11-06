'use client';

import { ChevronDownIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { paths } from '@/config/paths';

import type { Category } from '../types';

import { DeleteCategoryDialog } from './dialogs/delete-category-dialog';

/** The edit page's "More actions" menu. After a delete the page no longer exists, so it goes back to the list. */
export function CategoryPageActions({
  slug,
  category,
}: {
  slug: string;
  category: Pick<Category, 'id' | 'name'>;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const openingDialog = useRef(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            More actions <ChevronDownIcon aria-hidden="true" />
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
      <DeleteCategoryDialog
        slug={slug}
        category={category}
        open={deleting}
        onOpenChange={setDeleting}
        onDeleted={() => router.push(paths.mp.categories.getHref(slug))}
      />
    </>
  );
}
