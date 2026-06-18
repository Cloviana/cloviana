import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';

import { AppSidebar } from '@/app/_components/sidebar';
import { ErrorFallback } from '@/components/fallbacks/error-fallback';
import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getBusinessQueryOptions } from '@/features/businesses/api/get-business';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
};

export default async function Layout({ children, params }: LayoutProps) {
  const { businessId } = await params;

  const qc = new QueryClient();
  let business;
  try {
    business = await qc.ensureQueryData(getBusinessQueryOptions(businessId));
  } catch {
    // If it fails, standard children routes will handle the redirect
  }

  const monitoringDisabled = business?.monitoringEnabled === false;

  return (
    <SidebarProvider
      className="h-svh w-full overflow-hidden"
      style={{ '--sidebar-width': '13.75rem' } as React.CSSProperties}
    >
      <AppSidebar className="border-r border-gray-200 bg-[hsl(0,0%,97%)]" />
      <SidebarInset className="peec-bg-white relative flex min-h-svh max-w-full min-w-0 flex-1 flex-col [--main-page-title-height:--spacing(12)]">
        <div className="relative flex-1 overflow-y-auto">
          {monitoringDisabled ? (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 bg-slate-50">
              <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                <div className="inline-flex items-center justify-center size-12 rounded-full bg-amber-50 text-amber-600 mb-4">
                  <ShieldAlert className="size-6" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Monitoring Disabled
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Your monitoring has been temporarily deactivated. Please contact support to restore access to your dashboard.
                </p>
                <div className="mt-6">
                  <a
                    href="mailto:support@cloviana.com"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <Suspense fallback={<LoadingFallback />}>
              <ErrorBoundary fallback={<ErrorFallback />}>
                {children}
              </ErrorBoundary>
            </Suspense>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
