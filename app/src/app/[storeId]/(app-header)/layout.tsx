import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from '@/components/fallbacks/error-fallback';
import { LoadingFallback } from '@/components/fallbacks/loading-fallback';

import { DashboardHeader } from './_components/dashboard-header';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white p-1.5">
      <DashboardHeader />
      <main className="bg-background flex-1 overflow-y-auto rounded-lg border">
        <Suspense fallback={<LoadingFallback />}>
          <ErrorBoundary fallback={<ErrorFallback />}>{children}</ErrorBoundary>
        </Suspense>
      </main>
    </div>
  );
}
