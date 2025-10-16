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

export const AppHeader = () => {
  const { storeId } = useParams() as { storeId: string };
  const { user, isLoading: isUserLoading } = useUser();
  const { data: store, isLoading: isStoreLoading } = useGetStore(storeId);

  return (
    <header className="bg-background">
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex items-center gap-2.5">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <Image src="/logo-icon.png" alt="logo" width={18} height={18} />

          {isUserLoading || !user ? (
            <Skeleton className="h-[22px] w-[200px] rounded-full" />
          ) : (
            <div className="flex cursor-not-allowed items-center gap-2 rounded-md px-1.5 py-1 hover:bg-gray-100">
              <span className="text-sm font-semibold">
                {user.email}'s Account
              </span>
              <ChevronsUpDown size={16} className="text-foreground-light" />
            </div>
          )}
        </div>
        <div className="flex cursor-not-allowed items-center gap-2">
          <UserRound width={16} height={16} />
        </div>
      </div>
      <div className="flex h-12 shrink-0 items-center gap-2 overflow-x-auto border-b px-4">
        {isStoreLoading || !store ? (
          <React.Fragment>
            <Skeleton className="h-[22px] w-[100px] rounded-full" />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="flex cursor-not-allowed items-center gap-2 rounded-md px-1.5 py-1 hover:bg-gray-100">
              <Avatar className="h-5 w-5">
                <AvatarImage src={store.profileUrl} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold">{store.domainUrl}</span>
              <ChevronsUpDown size={16} className="text-foreground-light" />
            </div>
            <div className=""></div>
            {!store.channel ? (
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant={'warning'}
                    className="rounded-full font-normal"
                  >
                    <ShieldAlert size={12} className="mr-1" />
                    Inactive
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="max-w-xs">
                    <p>
                      Your Cloviana services are inactive. Connect your Shopify
                      from the{' '}
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
              <Badge variant={'success'} className="rounded-full font-normal">
                <Check size={12} className="mr-1" />
                Active
              </Badge>
            )}
            <Badge variant={'outline'} className="rounded-full font-normal">
              Free plan
            </Badge>
          </React.Fragment>
        )}
      </div>
    </header>
  );
};
