'use client';

import { useRouter } from 'next/navigation';
import { FC } from 'react';

import { useGetStore } from '@/api/stores/get-store';
import { GIcon } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/features/auth/actions/sign-out';

interface SidebarStoreDropwdownProps {
  storeId: string;
}

export const SidebarStoreDropwdown: FC<SidebarStoreDropwdownProps> = ({
  storeId,
}) => {
  const { data: store } = useGetStore(storeId);
  const { refresh } = useRouter();

  const handleSignOut = async () => {
    const { success } = await signOut();
    if (success) refresh();
  };

  if (!store) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-fit items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-sidebar-item-hover focus:outline-none">
          <img
            className="size-3.5"
            src={store.profileUrl}
            alt="store-profile"
          />
          <span className="text-sm font-semibold">{store.name}</span>
          <GIcon
            name={'chevron_right'}
            className={'shrink-0 rotate-90 text-foreground-light'}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[300px]"
        side="bottom"
        align="start"
        sideOffset={8}
      >
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Invite and manage members</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
