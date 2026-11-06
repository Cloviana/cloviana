import type { ReactNode } from 'react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { AppHeader } from './app-header/app-header';
import { AppSidebar } from './app-sidebar/app-sidebar';

export function AppShell({
  children,
  marketplace,
  defaultOpen,
}: {
  children: ReactNode;
  marketplace: { slug: string; name: string };
  defaultOpen: boolean;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      className="h-svh flex-col [&_[data-slot=sidebar-container]]:top-12 [&_[data-slot=sidebar-container]]:h-[calc(100svh-3rem)]"
    >
      <AppHeader marketplace={marketplace} />
      <div className="flex min-h-0 flex-1">
        <AppSidebar marketplace={marketplace} />
        <SidebarInset>{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
