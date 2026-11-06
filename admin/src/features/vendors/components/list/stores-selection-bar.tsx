'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BanIcon,
  CircleCheckIcon,
  StarIcon,
  StarOffIcon,
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

import { updateStoresAction } from '../../actions/update-stores';
import { storeKeys } from '../../queries';
import type { StoreChanges, StoreListItem } from '../../types/seller';

type SelectedStore = Pick<StoreListItem, 'id' | 'status' | 'featured'>;
type Action = 'ACTIVE' | 'SUSPENDED' | 'FEATURE' | 'UNFEATURE';

type ActionCopy = {
  label: string;
  icon: LucideIcon;
  changes: StoreChanges;
  title: (stores: string) => string;
  description: string;
  done: (stores: string) => string;
};

const actions: Record<Action, ActionCopy> = {
  ACTIVE: {
    label: 'Set as active',
    icon: CircleCheckIcon,
    changes: { status: 'ACTIVE' },
    title: (stores) => `Set ${stores} as active?`,
    description: 'Active stores can sign in and sell on your marketplace.',
    done: (stores) => `${stores} set as active.`,
  },
  SUSPENDED: {
    label: 'Set as inactive',
    icon: BanIcon,
    changes: { status: 'SUSPENDED' },
    title: (stores) => `Set ${stores} as inactive?`,
    description:
      'Inactive stores are suspended: they stop selling until you set them as active again. Their data is kept.',
    done: (stores) => `${stores} set as inactive.`,
  },
  FEATURE: {
    label: 'Feature stores',
    icon: StarIcon,
    changes: { featured: true },
    title: (stores) => `Feature ${stores}?`,
    description: 'Featured stores are marked as featured in your marketplace.',
    done: (stores) => `${stores} featured.`,
  },
  UNFEATURE: {
    label: 'Unfeature stores',
    icon: StarOffIcon,
    changes: { featured: false },
    title: (stores) => `Unfeature ${stores}?`,
    description: 'Unfeatured stores are no longer marked as featured.',
    done: (stores) => `${stores} unfeatured.`,
  },
};

// Priority order: the bar keeps the first actions visible and moves the rest into its menu as it narrows.
const order: Action[] = ['ACTIVE', 'SUSPENDED', 'FEATURE', 'UNFEATURE'];

const plural = (count: number) =>
  `${count} ${count === 1 ? 'store' : 'stores'}`;

// An action only affects stores it would change. Terminated stores are never changed in bulk.
function applies(action: Action, store: SelectedStore) {
  if (store.status === 'TERMINATED') return false;
  switch (action) {
    case 'ACTIVE':
      return store.status !== 'ACTIVE';
    case 'SUSPENDED':
      return store.status !== 'SUSPENDED';
    case 'FEATURE':
      return !store.featured;
    case 'UNFEATURE':
      return store.featured;
  }
}

export function StoresSelectionBar({
  slug,
  stores,
  open: visible,
  onClear,
}: {
  slug: string;
  stores: SelectedStore[];
  open: boolean;
  onClear: () => void;
}) {
  const queryClient = useQueryClient();
  // `action` stays set after the dialog closes so its content doesn't blank out during the exit animation.
  const [action, setAction] = useState<Action>('ACTIVE');
  const [open, setOpen] = useState(false);
  const choose = (next: Action) => {
    setAction(next);
    setOpen(true);
  };

  const targetsFor = (next: Action) =>
    stores.filter((store) => applies(next, store));
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
      const ids = targetsFor(next).map((store) => store.id);
      const result = await updateStoresAction(slug, ids, actions[next].changes);
      return result.success
        ? { success: true, message: actions[next].done(plural(result.updated)) }
        : result;
    },
    onSuccess: async (result) => {
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: storeKeys.all(slug) });
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
        <ActionBar aria-label="Selected stores">
          <ActionBarTitle>{stores.length} selected</ActionBarTitle>
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
