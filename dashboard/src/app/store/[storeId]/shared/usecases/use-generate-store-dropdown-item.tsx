import { useRouter } from 'next/navigation';

import { signOut } from '@/features/auth/actions/sign-out';

import { MenuEntry } from '../models/store-dropdown-interface';

export const useGenerateStoreDropdownItem = () => {
  const { refresh } = useRouter();

  const handleSignOut = async () => {
    const { success } = await signOut();
    if (success) refresh();
  };

  const menu: MenuEntry[] = [
    { type: 'item', label: 'Settings' },
    { type: 'item', label: 'Dashboard' },
    { type: 'separator' },
    { type: 'item', label: 'Profile Settings' },
    { type: 'item', label: 'Billing & Subscription' },
    { type: 'separator' },
    {
      type: 'item',
      label: 'Log out',
      intent: 'danger',
      onSelect: handleSignOut,
    },
  ];

  return {
    menu,
  };
};
