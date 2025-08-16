'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import dynamic from 'next/dynamic';
import Image from 'next/image';

import { AccountDropdown } from './account-dropdown';

const ExpandMoreIcon = dynamic(() => import('@mui/icons-material/ExpandMore'), {
  ssr: false,
});

export const Logo = () => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <div className="flex cursor-default items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-[#eeeeee]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-md bg-white p-1">
              {/* Store Logo Goes Here */}
              <Image
                src="/logo-icon.png"
                alt="App Logo"
                width={16}
                height={16}
              />
            </div>
            {/* Store Name Goes Here */}
            <span className="select-none text-sm font-semibold">
              Your Store Name
            </span>
          </div>
          <ExpandMoreIcon
            fontSize="inherit"
            className="size-1 text-foreground"
          />
        </div>
      </DropdownMenu.Trigger>
      <AccountDropdown />
    </DropdownMenu.Root>
  );
};
