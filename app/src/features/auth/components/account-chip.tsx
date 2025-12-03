import { useQueryClient } from '@tanstack/react-query';
import { CreditCard, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { paths } from '@/config/paths';
import { signOut } from '@/features/auth/actions/sign-out';
import { useUser } from '@/hooks/use-user';
import { useSubscriptionModal } from '@/stores/subscription-modal';

import { ProfileIcon } from './profile-icon';

export const AccountChip = () => {
  const [signingOut, setSigningOut] = useState(false);

  const { user, isLoading } = useUser();
  const { open: openSubscriptionModal } = useSubscriptionModal();
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
        <DropdownMenuTrigger className="rounded-full">
          <ProfileIcon user={user} isLoading={isLoading} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" sideOffset={6}>
          <DropdownMenuGroup>
            <DropdownMenuItem className="pointer-events-none flex items-center gap-3">
              <ProfileIcon user={user} isLoading={isLoading} />
              <span className="text-[13px]">{user && user.email}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="hidden"
              onClick={openSubscriptionModal}
            >
              <CreditCard />
              Subscription
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {signingOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/30 backdrop-blur-xs">
          <span className="loading loading-spinner loading-sm"></span>
        </div>
      )}
    </>
  );
};
