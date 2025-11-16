'use client';

import { Check, ChevronsUpDown, ShieldAlert, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react';

import { useGetStore } from '@/api/stores/get-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { paths } from '@/config/paths';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/utils/cn';

type DivProps = React.HTMLAttributes<HTMLDivElement>;
type HeaderProps = React.ComponentProps<'header'>;

const Root = ({ className, ...props }: HeaderProps) => (
  <header {...props} className={cn('bg-background', className)} />
);

const Row = ({ className, ...props }: DivProps) => (
  <div
    {...props}
    className={cn(
      'flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4',
      className,
    )}
  />
);

const Start = ({ className, ...props }: DivProps) => (
  <div {...props} className={cn('flex items-center gap-2.5', className)} />
);

const End = ({ className, ...props }: DivProps) => (
  <div {...props} className={cn('flex items-center gap-2', className)} />
);

const Logo = ({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Link>, 'href'>) => {
  const { storeId } = useParams() as { storeId: string };
  return (
    <Link {...props} href={paths.store.getHref(storeId)} className={className}>
      <Image
        src="/logo-icon.png"
        alt="logo"
        className="transition-transform hover:rotate-12"
        width={18}
        height={18}
      />
    </Link>
  );
};

const AccountChip = ({ className }: { className?: string }) => {
  const { user, isLoading } = useUser();
  if (isLoading || !user)
    return <Skeleton className="h-[22px] w-[200px] rounded-full" />;
  return (
    <div
      className={cn(
        'flex cursor-not-allowed items-center gap-2 rounded-md px-1.5 py-1 hover:bg-gray-100',
        className,
      )}
    >
      <span className="text-sm font-semibold">{user.email}'s Account</span>
      <ChevronsUpDown size={16} className="text-foreground-light" />
    </div>
  );
};

const StoreChip = ({ className }: { className?: string }) => {
  const { storeId } = useParams() as { storeId: string };
  const { data: store, isLoading } = useGetStore(storeId);
  if (isLoading || !store)
    return <Skeleton className="h-[22px] w-[100px] rounded-full" />;
  return (
    <div
      className={cn(
        'flex cursor-not-allowed items-center gap-2 rounded-md px-1.5 py-1 hover:bg-gray-100',
        className,
      )}
    >
      <Avatar className="h-5 w-5">
        <AvatarImage src={store.profileUrl} />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <span className="text-sm font-semibold">{store.domainUrl}</span>
      <ChevronsUpDown size={16} className="text-foreground-light" />
    </div>
  );
};

const StoreStatusBadges = ({ className }: { className?: string }) => {
  const { storeId } = useParams() as { storeId: string };
  const { data: store, isLoading } = useGetStore(storeId);
  if (isLoading || !store) return null;
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!store.channel ? (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="warning" className="rounded-full font-normal">
              <ShieldAlert size={12} className="mr-1" />
              Inactive
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="max-w-xs">
              <p>
                Your Cloviana services are inactive. Connect your Shopify from
                the{' '}
                <Link
                  className="underline"
                  href={paths.store.integrations.getHref(storeId)}
                >
                  integrations section.
                </Link>
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Badge variant="sky">
          <Check size={12} className="mr-1" />
          Active
        </Badge>
      )}
    </div>
  );
};

const SidebarToggle = ({ className }: { className?: string }) => (
  <SidebarTrigger className={cn('-ml-1 md:hidden', className)} />
);

const UserIcon = () => <UserRound width={16} height={16} />;

export {
  Root,
  Row,
  Start,
  End,
  Logo,
  AccountChip,
  StoreChip,
  StoreStatusBadges,
  SidebarToggle,
  UserIcon,
};
