'use client';

import { ReactNode } from 'react';

import { DashboardSidebar } from './dashboard-sidebar';

type DashboardLayoutProps = {
  businessId: string;
  children: ReactNode;
};

export function DashboardLayout({
  businessId,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DashboardSidebar businessId={businessId} />
      <div className="pl-64">
        {/* Top Header Placeholder */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-end border-b border-slate-200 bg-white/80 px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800 dark:text-slate-300">
              Trial ends in 7 days
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
