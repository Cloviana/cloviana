'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { AuthUser } from '@supabase/supabase-js';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useGetStore } from '@/api/stores/get-store';
import { signOut } from '@/features/auth/actions/sign-out';
import { createClient } from '@/lib/supabase/client';

import { SubscriptionDialog } from './subscription-dialog';

export const AccountDropdown = () => {
  const { refresh } = useRouter();
  const { storeId } = useParams();
  const supabase = createClient();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { isLoading: storeLoading } = useGetStore(storeId as string);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, [supabase.auth]);

  const handleSignOut = async () => {
    const { success } = await signOut();
    if (success) refresh();
  };

  if (loading || !user || storeLoading)
    return <div className="h-7 w-36 animate-pulse rounded-md bg-surface-200" />;

  const {
    user_metadata: { firstName = '' },
    email,
  } = user;

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 rounded transition-colors focus:outline-none">
            <div className="flex size-7 items-center justify-center rounded-full bg-gray-400 text-white transition-colors hover:bg-gray-400/90">
              {firstName.charAt(0)}
            </div>
            {/*<div className="flex-1 max-w-[120px] min-w-0 flex flex-col text-left overflow-hidden">
      <span className="block truncate text-xs font-semibold">
        {firstName} {lastName}
      </span>
      <span className="block truncate text-xs text-foreground-lighter">
        {store?.name}
      </span>
    </div>*/}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={5}
            align="end"
            className="dropdown-content w-72"
          >
            <div className="dropdown-content-section">
              <DropdownMenu.Item
                onSelect={() => setDialogOpen(true)}
                className="dropdown-item"
              >
                Subscription
              </DropdownMenu.Item>
            </div>

            <hr />

            <div className="dropdown-content-section">
              <div className="dropdown-item pointer-events-none font-medium">
                {email}
              </div>
              <DropdownMenu.Item
                className="dropdown-item"
                onClick={handleSignOut}
              >
                Log out
              </DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <SubscriptionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};
