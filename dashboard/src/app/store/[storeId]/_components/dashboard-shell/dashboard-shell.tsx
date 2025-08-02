import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from './components/error-fallback';
import { Header } from './components/header';
import { LoadingFallback } from './components/loading-fallback';
import { Sidebar } from './components/sidebar';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <div className="flex h-11 shrink-0 border-b">
        <Header />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden min-h-0 w-60 border-r md:flex">
          <Sidebar />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingFallback />}>
            <ErrorBoundary fallback={<ErrorFallback />}>
              {children}
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
