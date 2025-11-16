import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AppHeader } from '@/app/_components/header';
import { ErrorFallback } from '@/components/fallbacks/error-fallback';
import { LoadingFallback } from '@/components/fallbacks/loading-fallback';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader />
      <main className="bg-background flex-1 overflow-y-auto rounded-t-2xl border">
        <Suspense fallback={<LoadingFallback />}>
          <ErrorBoundary fallback={<ErrorFallback />}>{children}</ErrorBoundary>
        </Suspense>
      </main>
    </div>
  );
}
