'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArchiveIcon,
  CircleCheckIcon,
  EyeOffIcon,
  FileIcon,
  Trash2Icon,
  XIcon,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  ActionBar,
  ActionBarActions,
  ActionBarButton,
  ActionBarPortal,
  ActionBarSeparator,
  ActionBarTitle,
} from '@/components/ui/action-bar';
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

import { deleteProductsAction } from '../../actions/delete-products';
import { setProductsStatusAction } from '../../actions/set-products-status';
import { productKeys } from '../../queries';
import type { BulkProductStatus, ProductListItem } from '../../types';

type SelectedProduct = Pick<ProductListItem, 'id' | 'status'>;
type Action = BulkProductStatus | 'DELETE';

type ActionCopy = {
  label: string;
  icon: LucideIcon;
  title: (products: string) => string;
  description: string;
  done: (products: string) => string;
};

const actions: Record<Action, ActionCopy> = {
  PUBLISHED: {
    label: 'Set as active',
    icon: CircleCheckIcon,
    title: (products) => `Set ${products} as active?`,
    description:
      'Setting products as active will make them visible on your marketplace.',
    done: (products) => `${products} set as active.`,
  },
  DRAFT: {
    label: 'Set as draft',
    icon: FileIcon,
    title: (products) => `Set ${products} as draft?`,
    description:
      'Setting products as draft will hide them from your marketplace.',
    done: (products) => `${products} set as draft.`,
  },
  UNLISTED: {
    label: 'Unlist products',
    icon: EyeOffIcon,
    title: (products) => `Unlist ${products}?`,
    description:
      'Unlisted products are removed from listings and search. They stay available by direct link.',
    done: (products) => `${products} unlisted.`,
  },
  ARCHIVED: {
    label: 'Archive products',
    icon: ArchiveIcon,
    title: (products) => `Archive ${products}?`,
    description:
      'Archiving products will hide them from your marketplace. Their offers and history will be kept.',
    done: (products) => `${products} archived.`,
  },
  DELETE: {
    label: 'Delete products',
    icon: Trash2Icon,
    title: (products) => `Delete ${products}?`,
    description:
      "Deleting products can't be undone. Products with offers or reviews can't be deleted, so archive those instead. Their media will stay in your media library.",
    done: (products) => `${products} deleted.`,
  },
};

// Priority order: the bar keeps the first actions visible and moves the rest into its menu as it narrows.
const order: Action[] = [
  'PUBLISHED',
  'DRAFT',
  'ARCHIVED',
  'UNLISTED',
  'DELETE',
];

const plural = (count: number) =>
  `${count} ${count === 1 ? 'product' : 'products'}`;

export function ProductsSelectionBar({
  slug,
  products,
  open: visible,
  onClear,
}: {
  slug: string;
  products: SelectedProduct[];
  open: boolean;
  onClear: () => void;
}) {
  const queryClient = useQueryClient();
  // `action` stays set after the dialog closes so its content doesn't blank out during the exit animation.
  const [action, setAction] = useState<Action>('PUBLISHED');
  const [open, setOpen] = useState(false);
  const choose = (next: Action) => {
    setAction(next);
    setOpen(true);
  };

  // A status action only affects products not already in that status; delete affects them all.
  const targetsFor = (next: Action) =>
    next === 'DELETE'
      ? products
      : products.filter((product) => product.status !== next);
  const available = order
    .filter((next) => targetsFor(next).length > 0)
    .map((next) => ({
      id: next,
      label: actions[next].label,
      icon: actions[next].icon,
      onSelect: () => choose(next),
    }));

  const mutation = useMutation({
    mutationFn: async (
      next: Action,
    ): Promise<{ success: boolean; message: string }> => {
      const ids = targetsFor(next).map((product) => product.id);

      if (next !== 'DELETE') {
        const result = await setProductsStatusAction(slug, ids, next);
        return result.success
          ? {
              success: true,
              message: actions[next].done(plural(result.updated)),
            }
          : result;
      }

      const result = await deleteProductsAction(slug, ids);
      if (!result.success) return result;
      if (result.deleted === 0) {
        return {
          success: false,
          message:
            "None of the selected products could be deleted. Products with offers or reviews can't be deleted. Archive them instead.",
        };
      }
      const skipped = result.skipped
        ? ` ${plural(result.skipped)} skipped because they have offers or reviews.`
        : '';
      return {
        success: true,
        message: actions.DELETE.done(plural(result.deleted)) + skipped,
      };
    },
    onSuccess: async (result) => {
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: productKeys.lists(slug),
      });
      toast.success(result.message);
      setOpen(false);
      onClear();
    },
    onError: () => toast.error('Something went wrong. Please try again.'),
  });

  const { title, description, label } = actions[action];

  return (
    <>
      <ActionBarPortal open={visible}>
        <ActionBar aria-label="Selected products">
          <ActionBarTitle>{products.length} selected</ActionBarTitle>
          <ActionBarSeparator />
          <ActionBarActions actions={available} />
          <ActionBarSeparator />
          <ActionBarButton
            size="icon"
            type="button"
            aria-label="Clear selection"
            onClick={onClear}
          >
            <XIcon aria-hidden="true" />
          </ActionBarButton>
        </ActionBar>
      </ActionBarPortal>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!mutation.isPending) setOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {title(plural(targetsFor(action).length))}
            </AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant={action === 'DELETE' ? 'destructive-solid' : undefined}
              loading={mutation.isPending}
              onClick={() => mutation.mutate(action)}
            >
              {label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
