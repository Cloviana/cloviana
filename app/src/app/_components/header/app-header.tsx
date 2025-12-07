'use client';

import { CircleQuestionMark } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { SUPPORT_EMAIL } from '@/constants/emails';
import { AccountChip } from '@/features/auth/components/account-chip';
import { useIsMobile } from '@/hooks/use-mobile';

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
          </div>
          <div className="flex items-center gap-x-2">
            <Button asChild variant="ghost" size="sm">
              <a href={`mailto:${SUPPORT_EMAIL}`}>Support</a>
            </Button>
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
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              target="_blank"
              rel="noreferrer"
            >
              <CircleQuestionMark />
              Support
            </a>
          </Button>

          <AccountChip />
        </div>
      </div>
    </nav>
  );
};
