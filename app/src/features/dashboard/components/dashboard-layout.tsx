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
    <div className="min-h-screen bg-[#fafafa]">
      <DashboardSidebar businessId={businessId} />
      <div className="pl-64">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-end border-b border-slate-200 bg-white/85 px-6 backdrop-blur">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              Managed workspace
            </span>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
