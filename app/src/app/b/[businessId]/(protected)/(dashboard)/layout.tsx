import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AppSidebar } from '@/app/_components/sidebar';
import { ErrorFallback } from '@/components/fallbacks/error-fallback';
import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider
      className="h-svh w-full overflow-hidden"
      style={{ '--sidebar-width': '13.75rem' } as React.CSSProperties}
    >
      <div className="flex h-full w-full flex-col bg-[#EBF1FA] p-3">
        <div className="flex h-full w-full overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl">
          <AppSidebar className="border-r border-gray-200 bg-[hsl(0,0%,97%)]" />
          <SidebarInset className="flex flex-1 min-w-0 flex-col bg-white">
            <div className="flex-1 overflow-y-auto relative">
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
