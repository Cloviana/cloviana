'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EllipsisIcon, MailIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { resendStoreInviteAction } from '../../actions/resend-store-invite';
import { storeKeys } from '../../queries';
import type { StoreListItem } from '../../types/seller';

/** The row's "More actions" menu. Resending only makes sense while the admin hasn't accepted the invitation. */
export function StoreRowActions({
  slug,
  store,
}: {
  slug: string;
  store: Pick<StoreListItem, 'id' | 'name' | 'adminInvite'>;
}) {
  const queryClient = useQueryClient();
  const { adminInvite } = store;
  const canResend = adminInvite !== null && adminInvite.status !== 'accepted';

  const resend = useMutation({
    mutationFn: async () => {
      if (!adminInvite) return { success: false as const, message: '' };
      return resendStoreInviteAction(slug, store.id, adminInvite.email);
    },
    onSuccess: async (result) => {
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: storeKeys.all(slug) });
      toast.success(`Invitation sent to ${adminInvite?.email}.`);
    },
    onError: () => toast.error('Something went wrong. Please try again.'),
  });

  if (!canResend) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`More actions for ${store.name}`}
        >
          <EllipsisIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          disabled={resend.isPending}
          onSelect={() => resend.mutate()}
        >
          <MailIcon aria-hidden="true" />
          Resend invitation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
