'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReactNode } from 'react';

import { paths } from '@/config/paths';
import { useIsMobile } from '@/hooks/use-mobile';

import { AccountChip } from './components/account-chip';
import { StoreChip } from './components/store-chip';

export const AppHeader = ({
  sidebarTrigger,
}: {
  sidebarTrigger?: ReactNode;
}) => {
  const { storeId } = useParams<{ storeId: string }>();

  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <nav className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-2">
          <div className="flex shrink-0 items-center gap-x-4">
            {sidebarTrigger}
            <div className="-ml-1.5 flex items-center gap-x-2">
              <StoreChip />
            </div>
          </div>
          <div className="flex items-center">
            <AccountChip />
          </div>
        </div>
      </nav>
    );
  }
  /*
if (isMobile) {
    return (
      <nav className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-2">
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
          </div>
          <div className="flex items-center">
            <AccountChip />
          </div>
        </div>
        <div className="px-5 py-2">
          <div className="flex items-center gap-x-2 -ml-1.5">
            <StoreChip />
          </div>
        </div>
      </nav>
    );
  }*/

  return (
    <nav className="flex flex-col">
      <div className="flex items-center justify-between px-5 py-2">
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
    </nav>
  );
};
