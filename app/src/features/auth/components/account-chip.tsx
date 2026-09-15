'use client';

import { useQueryClient } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { paths } from '@/config/paths';
import { signOut } from '@/features/auth/actions/sign-out';
import { useDashboardTheme } from '@/features/dashboard/theme/dashboard-theme';
import { useUser } from '@/hooks/use-user';

import { ProfileIcon } from './profile-icon';

export const AccountChip = () => {
  const [signingOut, setSigningOut] = useState(false);

  const { user, isLoading } = useUser();
  const { theme, setTheme } = useDashboardTheme();
  const { push } = useRouter();
  const qc = useQueryClient();

  const handleSignOut = async () => {
    setSigningOut(true);
    const { success } = await signOut();

    if (!success) {
      await qc.invalidateQueries();
      setSigningOut(false);
    } else {
      push(paths.auth.login.getHref());
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <ProfileIcon user={user} isLoading={isLoading} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" sideOffset={6}>
          <DropdownMenuItem>
            <UserRound />
            Your profile
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40" sideOffset={8}>
              <DropdownMenuItem
                data-active={theme === 'light'}
                onClick={() => setTheme('light')}
              >
                Light
              </DropdownMenuItem>
              <DropdownMenuItem
                data-active={theme === 'dark'}
                onClick={() => setTheme('dark')}
              >
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem
                data-active={theme === 'system'}
                onClick={() => setTheme('system')}
              >
                System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {signingOut && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <span className="loading loading-spinner loading-sm"></span>
        </div>
      )}
    </>
  );
};
