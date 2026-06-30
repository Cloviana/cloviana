'use client';

import { type ReactNode } from 'react';

import { AccountChip } from '@/features/auth/components/account-chip';

type DashboardHeaderProps = {
  children?: ReactNode;
};

export function DashboardHeader({ children }: DashboardHeaderProps) {
  return (
    <header className="bg-sidebar border-sidebar-border flex h-12 shrink-0 items-center border-b px-3.5">
      <div className="flex flex-1 items-center">{children}</div>
      <div className="flex h-full items-center gap-3.5">
        <AccountChip />
      </div>
    </header>
  );
}
