'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

import { deleteCategoryAction } from '../../actions/delete-category';
import { categoryImpactQueryOptions, categoryKeys } from '../../queries';
import type { Category } from '../../types';

const count = (amount: number, one: string, many: string) =>
  `${amount} ${amount === 1 ? one : many}`;

/**
 * Confirms deleting a category together with its subcategories. It asks the API what else will go, so the counts
 * are on screen before the button can be pressed.
 */
export function DeleteCategoryDialog({
  slug,
  category,
  open,
  onOpenChange,
  onDeleted,
}: {
  slug: string;
  category: Pick<Category, 'id' | 'name'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const impact = useQuery({
    ...categoryImpactQueryOptions(slug, category.id),
    enabled: open,
  });
  const { subcategories = 0, products = 0 } = impact.data ?? {};

  const remove = useMutation({
    mutationFn: () => deleteCategoryAction(slug, category.id),
    onSuccess: async (result) => {
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all(slug) });
      toast.success('Category deleted.');
      onOpenChange(false);
      onDeleted?.();
    },
    onError: () =>
      toast.error('Could not delete the category. Please try again.'),
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!remove.isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{category.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            You're about to delete this category permanently. This can't be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {impact.isError ? (
          <p role="alert" className="text-body text-text-subtle">
            We couldn't check what else will be deleted.{' '}
            <Button
              type="button"
              variant="link"
              size="inline"
              onClick={() => void impact.refetch()}
            >
              Try again
            </Button>
          </p>
        ) : (
          (subcategories > 0 || products > 0) && (
            <ul className="text-body text-text-subtle flex list-disc flex-col gap-1 pl-5">
              {subcategories > 0 && (
                <li>
                  {count(subcategories, 'subcategory', 'subcategories')} will be
                  deleted too.
                </li>
              )}
              {products > 0 && (
                <li>
                  {count(products, 'product', 'products')} will no longer be in{' '}
                  {subcategories > 0 ? 'these categories' : 'this category'}.
                </li>
              )}
            </ul>
          )
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>
            Cancel
          </AlertDialogCancel>
          {/* Loading until the counts are known, so nothing is deleted without them on screen. */}
          <AlertDialogAction
            variant="destructive-solid"
            loading={remove.isPending || impact.isPending}
            disabled={impact.isError}
            onClick={() => remove.mutate()}
          >
            Delete category
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
