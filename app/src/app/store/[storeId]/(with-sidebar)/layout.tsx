import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AppSidebar } from '@/components/composites/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import { ErrorFallback } from './_components/error-fallback';
import { Guard } from './_components/guard';
import { LoadingFallback } from './_components/loading-fallback';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-screen overflow-hidden">
        <header className="flex shrink-0 items-center gap-2 border-b px-4 py-2 md:hidden">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingFallback />}>
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Guard>{children}</Guard>
            </ErrorBoundary>
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
