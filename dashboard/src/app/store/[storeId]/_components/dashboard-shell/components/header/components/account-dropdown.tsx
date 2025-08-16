'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';

import { signOut } from '@/features/auth/actions/sign-out';

export const AccountDropdown = () => {
  const { refresh } = useRouter();

  const handleSignOut = async () => {
    const { success } = await signOut();
    if (success) refresh();
  };

  return (
    <>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={5}
          align="end"
          className="dropdown-content ml-3"
        >
          <div>
            <div className="dropdown-content-section">
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
