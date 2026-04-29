import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AppSidebar } from '@/app/_components/sidebar';
import { ErrorFallback } from '@/components/fallbacks/error-fallback';
import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { AppHeader } from '@/components/layout/header';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
      style={{ '--sidebar-width': '18rem' } as React.CSSProperties}
    >
      <div className="flex h-full min-h-0 w-full flex-col">
        <AppHeader sidebarTrigger={<SidebarTrigger />} />

        <div className="relative flex min-h-0 flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Suspense fallback={<LoadingFallback />}>
                <ErrorBoundary fallback={<ErrorFallback />}>
                  {children}
                </ErrorBoundary>
              </Suspense>
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
