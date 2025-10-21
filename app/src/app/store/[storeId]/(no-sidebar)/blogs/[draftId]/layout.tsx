import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { getBlogQueryOptions } from '@/api/blogs/get-blog';
import { ErrorFallback } from '@/components/fallbacks/error-fallback';
import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import * as AppHeader from '@/components/layouts/app-header';
import {
  DraftSidebar,
  DraftSidebarToggleButton,
} from '@/features/blogs/components/setup/draft-sidebar';
import { DrafterProvider } from '@/features/blogs/context/drafter';

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{
    draftId: string;
  }>;
}) {
  const qc = new QueryClient();

  const { draftId } = await params;

  await qc.prefetchQuery(getBlogQueryOptions(draftId));

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <DrafterProvider blogId={draftId}>
        <div className="bg-background flex h-screen w-full flex-col overflow-hidden">
          <AppHeader.Root>
            <AppHeader.Row>
              <AppHeader.Start>
                <AppHeader.Logo />
                <AppHeader.AccountChip />
              </AppHeader.Start>
              <AppHeader.End>
                <AppHeader.UserIcon />
              </AppHeader.End>
            </AppHeader.Row>

            <AppHeader.Row className="overflow-x-auto">
              <AppHeader.Start>
                <DraftSidebarToggleButton className="-ml-1 md:hidden" />
                <AppHeader.StoreChip />
                <AppHeader.StoreStatusBadges />
              </AppHeader.Start>
            </AppHeader.Row>
          </AppHeader.Root>

          <div className="relative flex min-h-0 flex-1">
            <DraftSidebar />
            <main className="flex min-h-0 min-w-0 flex-1 overflow-y-auto">
              <Suspense fallback={<LoadingFallback />}>
                <ErrorBoundary fallback={<ErrorFallback />}>
                  {children}
                </ErrorBoundary>
              </Suspense>
            </main>
          </div>
        </div>
      </DrafterProvider>
    </HydrationBoundary>
  );
}
