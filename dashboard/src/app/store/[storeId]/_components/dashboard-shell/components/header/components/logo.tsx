'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { AccountDropdown } from './account-dropdown';

export const Logo = () => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <div className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-all hover:bg-gray-100">
          <img src="/logo-full.png" alt="logo" className="h-auto w-[77px]" />
          <ExpandMoreIcon width={20} height={20} />
        </div>
      </DropdownMenu.Trigger>
      <AccountDropdown />
    </DropdownMenu.Root>
  );
};
