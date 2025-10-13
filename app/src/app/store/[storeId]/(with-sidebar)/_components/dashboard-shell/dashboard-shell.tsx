import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { MobileSidebarDrawer, Sidebar } from '../sidebar';

import { ErrorFallback } from './components/error-fallback';
import { Guard } from './components/guard';
import { LoadingFallback } from './components/loading-fallback';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="bg-sidebar-background flex h-screen flex-col overflow-hidden">
      <div className="border-b md:hidden">
        <div className="flex items-center gap-2 p-2">
          <MobileSidebarDrawer />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden min-h-0 w-60 md:flex">
          <Sidebar />
        </div>

        <div
          role="main"
          className="md:shadow-xs flex-1 overflow-hidden bg-white md:m-2 md:rounded-md md:border"
        >
          <Suspense fallback={<LoadingFallback />}>
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Guard>{children}</Guard>
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
