'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReactNode } from 'react';

import { paths } from '@/config/paths';
import { useIsMobile } from '@/hooks/use-mobile';

export const AppHeader = ({
  sidebarTrigger,
}: {
  sidebarTrigger?: ReactNode;
}) => {
  const { businessId } = useParams<{ businessId: string }>();

  if (!businessId) {
    throw new Error('businessId is required to render AppHeader');
  }

  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <nav className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-2">
          <div className="flex shrink-0 items-center gap-x-4">
            <Link href={paths.business.getHref(businessId)}>
              <img
                src="/logo-full.png"
                alt="Cloviana Logo"
                className="h-[20px]"
              />
            </Link>
            {sidebarTrigger}
          </div>
          <div className="flex items-center gap-x-2">{/*<AccountChip />*/}</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex flex-col">
      <div className="flex items-center justify-between px-5 py-2">
        <div className="flex shrink-0 items-center gap-x-4">
          <Link href={paths.business.getHref(businessId)}>
            <img
              src="/logo-full.png"
              alt="Cloviana Logo"
              className="h-[20px]"
            />
          </Link>
          {sidebarTrigger}
        </div>
        <div className="flex items-center gap-3">{/*<AccountChip />*/}</div>
      </div>
    </nav>
  );
};
