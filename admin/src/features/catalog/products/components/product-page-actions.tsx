'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ChevronDownIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { archiveProductAction } from '../actions/archive-product';
import { deleteProductAction } from '../actions/delete-product';
import { unarchiveProductAction } from '../actions/unarchive-product';
import { productKeys } from '../queries';

export function ProductPageActions({
  slug,
  productId,
  status,
  canDelete,
}: {
  slug: string;
  productId: string;
  status: string;
  canDelete: boolean;
}) {
  const archived = status === 'ARCHIVED';
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function changeArchiveStatus() {
    setPending(true);
    try {
      const result = await (archived
        ? unarchiveProductAction(slug, productId)
        : archiveProductAction(slug, productId));
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: productKeys.all(slug) });
      setOpen(false);
      toast.success(
        archived ? 'Product unarchived as a draft.' : 'Product archived.',
      );
      router.refresh();
    } catch {
      toast.error(
        archived
          ? 'Could not unarchive the product. Please try again.'
          : 'Could not archive the product. Please try again.',
      );
    } finally {
      setPending(false);
    }
  }

  async function removeProduct() {
    setPending(true);
    try {
      const result = await deleteProductAction(slug, productId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: productKeys.all(slug) });
      toast.success('Product deleted.');
      router.push(`/mp/${slug}/products`);
    } catch {
      toast.error('Could not delete the product. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            More actions <ChevronDownIcon aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            {archived ? (
              <ArchiveRestoreIcon aria-hidden="true" />
            ) : (
              <ArchiveIcon aria-hidden="true" />
            )}
            {archived ? 'Unarchive product' : 'Archive product'}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="items-start"
            disabled={!canDelete}
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2Icon
              className="mt-[calc((1lh_-_1rem)/2)]"
              aria-hidden="true"
            />
            <span className="flex flex-col">
              Delete product
              {!canDelete && (
                <span className="text-body-small text-text-subtlest/50 mt-px font-normal">
                  Has offers or reviews.
                </span>
              )}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!pending) setOpen(nextOpen);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archived ? 'Unarchive product?' : 'Archive product?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archived
                ? 'Unarchiving this product changes its status to Draft, so you can review it before making it active.'
                : 'Archiving this product changes its status to Archived. Its offers and history will be retained.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction loading={pending} onClick={changeArchiveStatus}>
              {archived ? 'Unarchive product' : 'Archive product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          if (!pending) setDeleteOpen(nextOpen);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              If you delete this product, this can't be undone. Its media will
              stay in your media library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive-solid"
              loading={pending}
              onClick={removeProduct}
            >
              Delete product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
