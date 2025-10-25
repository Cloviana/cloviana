import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from '@/components/fallbacks/error-fallback';
import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import * as AppHeader from '@/components/layouts/app-header';
import { AppSidebar } from '@/components/layouts/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AccessStageGuard } from '@/features/access/components/access-stage-guard';

import { Guard } from './_components/guard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="bg-background flex h-screen w-full flex-col overflow-hidden">
        <AppHeader.Root>
          <AppHeader.Row>
            <AppHeader.Start>
              <AppHeader.SidebarToggle />
              <AppHeader.Logo />
              <AppHeader.AccountChip />
            </AppHeader.Start>
            <AppHeader.End>
              <AppHeader.UserIcon />
            </AppHeader.End>
          </AppHeader.Row>

          <AppHeader.Row className="overflow-x-auto">
            <AppHeader.Start>
              <AppHeader.StoreChip />
              <AppHeader.StoreStatusBadges />
            </AppHeader.Start>
          </AppHeader.Row>
        </AppHeader.Root>

        <div className="relative flex min-h-0 flex-1">
          <AppSidebar className="absolute h-full" />
          <SidebarInset className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              <Suspense fallback={<LoadingFallback />}>
                <ErrorBoundary fallback={<ErrorFallback />}>
                  <AccessStageGuard>
                    <Guard>{children}</Guard>
                  </AccessStageGuard>
                </ErrorBoundary>
              </Suspense>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
