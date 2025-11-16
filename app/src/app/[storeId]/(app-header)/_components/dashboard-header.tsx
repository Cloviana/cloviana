'use client';

import { User } from '@supabase/auth-js';
import {
  ChevronsUpDown,
  CreditCard,
  User as IUser,
  LogOut,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useGetStore } from '@/api/stores/get-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { signOut } from '@/features/auth/actions/sign-out';
import { useUser } from '@/hooks/use-user';
import { useSubscriptionModal } from '@/stores/subscription-modal';
import { cn } from '@/utils/cn';

const StoreChip = ({ className }: { className?: string }) => {
  const { storeId } = useParams() as { storeId: string };
  const { data: store, isLoading } = useGetStore(storeId);
  if (isLoading || !store)
    return <Skeleton className="h-[22px] w-[100px] rounded-full" />;
  return (
    <div
      className={cn(
        'text-foreground-light flex cursor-not-allowed items-center gap-2 rounded-md px-1.5 py-1',
        className,
      )}
    >
      <Avatar className="size-5">
        <AvatarImage src={store.profileUrl} />
        <AvatarFallback />
      </Avatar>
      <span className="text-sm font-medium">{store.domainUrl}</span>
      <ChevronsUpDown size={13} strokeWidth={2.5} />
    </div>
  );
};

const ProfileIcon = ({
  user,
  isLoading,
}: {
  user: User | null;
  isLoading: boolean;
}) => {
  return (
    <div
      className={cn(
        'flex size-8 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 ring-gray-100 hover:ring-3',
        isLoading && 'animate-pulse',
      )}
    >
      {user ? (
        <span className="text-sm">{user.email![0].toUpperCase()}</span>
      ) : !isLoading ? (
        <IUser className="size-3.5" />
      ) : null}
    </div>
  );
};

const AccountChip = () => {
  const [signingOut, setSigningOut] = useState(false);

  const { user, isLoading } = useUser();
  const { open: openSubscriptionModal } = useSubscriptionModal();
  const { push } = useRouter();

  const handleSignOut = async () => {
    setSigningOut(true);
    const { success } = await signOut();

    if (!success) {
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
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={openSubscriptionModal}>
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

const StoreTabs = () => {
  const { storeId } = useParams() as { storeId: string };
  const pathname = usePathname();

  const tabs = [
    { label: 'Blog Posts', href: paths.store.getHref(storeId) },
    { label: 'Settings', href: `#`, disabled: true },
  ];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeContentRef = useRef<HTMLSpanElement | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [animate, setAnimate] = useState(false);
  const hasPositionRef = useRef(false);

  const normalizedPath = pathname.replace(/\/+$/, '');

  let activeIndex = tabs.reduce((best, tab, idx) => {
    const base = tab.href.replace(/\/+$/, '');
    const match =
      normalizedPath === base || normalizedPath.startsWith(`${base}/`);
    if (!match) return best;
    if (best === -1) return idx;
    return tab.href.length > tabs[best].href.length ? idx : best;
  }, -1);

  if (activeIndex === -1) activeIndex = 0;

  useEffect(() => {
    if (!containerRef.current || !activeContentRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const activeRect = activeContentRef.current.getBoundingClientRect();
    const next = {
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
    };
    setIndicator(next);
    if (!hasPositionRef.current) {
      hasPositionRef.current = true;
      requestAnimationFrame(() => setAnimate(true));
    }
  }, [normalizedPath, activeIndex]);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-x-1 pb-3">
        {tabs.map((tab, idx) => {
          const isActive = idx === activeIndex;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'hover:bg-accent rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-foreground-lighter/80 hover:text-foreground-lighter',
                tab.disabled && 'pointer-events-none',
              )}
            >
              <span
                ref={isActive ? activeContentRef : undefined}
                className="inline-block"
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div
        className={cn(
          'bg-foreground pointer-events-none absolute bottom-0 h-[2px] rounded-full',
          animate && 'transition-all duration-300',
          indicator.width === 0 && 'opacity-0',
        )}
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  );
};

export const DashboardHeader = () => {
  const { storeId } = useParams<{ storeId: string }>();
  return (
    <nav className="flex flex-col">
      <div className="flex items-center justify-between pt-4 pr-2 pb-2 pl-8">
        <div className="flex shrink-0 items-center gap-x-4">
          <Link href={paths.store.getHref(storeId)}>
            <Image
              src="/logo-icon.png"
              width={125}
              height={125}
              alt="Cloviana Logo"
              className="size-[18px]"
            />
          </Link>
          <div className="flex items-center gap-x-2">
            <StoreChip />
          </div>
        </div>
        <div className="flex items-center">
          <AccountChip />
        </div>
      </div>
      <div className="pt-2 pl-5">
        <StoreTabs />
      </div>
    </nav>
  );
};
