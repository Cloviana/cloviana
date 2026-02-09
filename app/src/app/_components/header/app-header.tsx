'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { paths } from '@/config/paths';
import { AccountChip } from '@/features/auth/components/account-chip';
import { useIsMobile } from '@/hooks/use-mobile';

export const AppHeader = ({
  sidebarTrigger,
}: {
  sidebarTrigger?: ReactNode;
}) => {
  const { storeId } = useParams<{ storeId: string }>();

  if (!storeId) {
    throw new Error('storeId is required to render AppHeader');
  }

  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <nav className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-2">
          <div className="flex shrink-0 items-center gap-x-4">
            <Link href={paths.store.getHref(storeId)}>
              <img
                src="/logo-full.png"
                alt="Cloviana Logo"
                className="h-[20px]"
              />
            </Link>
            <Badge variant={'secondary'}>Beta</Badge>
            {sidebarTrigger}
          </div>
          <div className="flex items-center gap-x-2">
            <AccountChip />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex flex-col">
      <div className="flex items-center justify-between px-5 py-2">
        <div className="flex shrink-0 items-center gap-x-4">
          <Link href={paths.store.getHref(storeId)}>
            <img
              src="/logo-full.png"
              alt="Cloviana Logo"
              className="h-[20px]"
            />
          </Link>
          <Badge variant={'secondary'}>Beta</Badge>
          {sidebarTrigger}
        </div>
        <div className="flex items-center gap-3">
          <AccountChip />
        </div>
      </div>
    </nav>
  );
};
