'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { paths } from '@/config/paths';
import { MinimalAccountChip } from '@/features/auth/components/minimal-account-chip';

export const MinimalHeader = () => {
  return (
    <nav className="flex flex-col">
      <div className="flex items-center justify-between px-5 py-2">
        <div className="flex shrink-0 items-center gap-x-4">
          <Link href={paths.onboarding.getHref()}>
            <img
              src="/logo-full.png"
              alt="Cloviana Logo"
              className="h-[20px]"
            />
          </Link>
          <Badge variant={'secondary'}>Beta</Badge>
        </div>
        <div className="flex items-center gap-3">
          <MinimalAccountChip />
        </div>
      </div>
    </nav>
  );
};
