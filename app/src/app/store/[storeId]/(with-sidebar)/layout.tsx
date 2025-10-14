import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AppHeader } from '@/components/composites/app-header';
import { AppSidebar } from '@/components/composites/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { ErrorFallback } from './_components/error-fallback';
import { Guard } from './_components/guard';
import { LoadingFallback } from './_components/loading-fallback';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full flex-col overflow-hidden">
        <AppHeader />
        <div className="relative flex flex-1">
          <AppSidebar className="absolute h-full" />
          <SidebarInset className="overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              <Suspense fallback={<LoadingFallback />}>
                <ErrorBoundary fallback={<ErrorFallback />}>
                  <Guard>{children}</Guard>
                </ErrorBoundary>
              </Suspense>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
