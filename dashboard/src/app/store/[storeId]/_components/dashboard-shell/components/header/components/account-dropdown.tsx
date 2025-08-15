'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { AuthUser } from '@supabase/supabase-js';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useGetStore } from '@/api/stores/get-store';
import { signOut } from '@/features/auth/actions/sign-out';
import { createClient } from '@/lib/supabase/client';

export const AccountDropdown = () => {
  const { refresh } = useRouter();
  const { storeId } = useParams();
  const supabase = createClient();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  const { email } = user;

  return (
    <>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={5}
          align="end"
          className="dropdown-content w-72"
        >
          <div>
            {/* <div className="dropdown-content-section">
              <DropdownMenu.Item
                onSelect={() => setDialogOpen(true)}
                className="dropdown-item"
              >
                Subscription
              </DropdownMenu.Item>
            </div> */}
            {/* 
            <hr /> */}

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
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </>
  );
};
