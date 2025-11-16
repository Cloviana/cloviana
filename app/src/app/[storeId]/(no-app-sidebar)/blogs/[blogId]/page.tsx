import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AppHeader } from '@/app/_components/header';
import { ErrorFallback } from '@/components/fallbacks/error-fallback';
import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import {
  DraftSidebar,
  DraftSidebarToggleButton,
} from '@/features/blogs/components/setup/draft-sidebar';
import { DraftView } from '@/features/blogs/components/setup/draft-view';
import { DrafterProvider } from '@/features/blogs/context/drafter';

export default async function DraftSetupPage({
  params,
}: {
  params: Promise<{
    blogId: string;
    storeId: string;
  }>;
}) {
  const { blogId, storeId } = await params;
  return (
    <DrafterProvider blogId={blogId} storeId={storeId}>
      <div className="bg-background flex h-screen w-full flex-col overflow-hidden">
        <header className="border-b">
          <AppHeader sidebarTrigger={<DraftSidebarToggleButton />} />
        </header>

        <div className="relative flex min-h-0 flex-1">
          <DraftSidebar />
          <main className="flex min-h-0 min-w-0 flex-1 overflow-y-auto">
            <Suspense fallback={<LoadingFallback />}>
              <ErrorBoundary fallback={<ErrorFallback />}>
                <DraftView />
              </ErrorBoundary>
            </Suspense>
          </main>
        </div>
      </div>
    </DrafterProvider>
  );
}
