import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { MobileSidebarDrawer } from '../../shared/view/presentation/mobile-sidebar-drawer';

import { ErrorFallback } from './components/error-fallback';
import { LoadingFallback } from './components/loading-fallback';
import { Sidebar } from './components/sidebar';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Mobile top bar with menu button */}
      <div className="sticky top-0 z-20 border-b bg-white md:hidden">
        <div className="flex items-center gap-2 p-2">
          <MobileSidebarDrawer />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden min-h-0 w-64 border-r md:flex">
          <Sidebar />
        </div>

        {/* Main content */}
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
