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
      <div className="bg-background flex h-screen w-screen flex-col">
        <header className="border-b">
          <AppHeader sidebarTrigger={<SidebarTrigger />} />
        </header>
        <div className="relative flex flex-1 overflow-hidden">
          <AppSidebar className="absolute h-full border-r" />

          <ScrollArea className="relative flex-1">
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
