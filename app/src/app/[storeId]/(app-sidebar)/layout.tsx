import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AppHeader } from '@/app/_components/header';
import { AppSidebar } from '@/app/_components/sidebar';
import { ErrorFallback } from '@/components/fallbacks/error-fallback';
import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen flex-col bg-white">
        <AppHeader sidebarTrigger={<SidebarTrigger />} />
        <div className="bg-background relative flex flex-1 overflow-hidden rounded-t-2xl border">
          <AppSidebar className="absolute h-full border-r" />

          <ScrollArea className="flex-1">
            <Suspense fallback={<LoadingFallback />}>
              <ErrorBoundary fallback={<ErrorFallback />}>
                {children}
              </ErrorBoundary>
            </Suspense>
          </ScrollArea>
        </div>
      </div>
    </SidebarProvider>
  );
}
