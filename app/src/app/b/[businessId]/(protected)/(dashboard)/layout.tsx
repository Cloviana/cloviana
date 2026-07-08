import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getBusinessQueryOptions } from '@/features/businesses/api/get-business';
import { getBusinessesQueryOptions } from '@/features/businesses/api/get-businesses';
import { DashboardSidebar } from '@/features/dashboard/components/dashboard-sidebar';
import { getQueryClient } from '@/lib/react-query/server';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
};

export default async function Layout({ children, params }: LayoutProps) {
  const { businessId } = await params;
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(getBusinessQueryOptions(businessId)),
    queryClient.prefetchQuery(getBusinessesQueryOptions()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="bg-background fixed inset-0 z-50 flex items-center justify-center p-6 text-center md:hidden">
        <div className="max-w-sm space-y-2">
          <h1 className="text-xl font-semibold">Desktop only</h1>
          <p className="text-foreground-light text-sm leading-6">
            This dashboard is not compatible with mobile screens yet. Please
            open it on a desktop device.
          </p>
        </div>
      </div>
      <div className="hidden h-svh md:block">
        <SidebarProvider
          className="h-svh overflow-hidden"
          style={
            {
              '--sidebar-width': '20rem',
              '--sidebar-width-icon': '2.6rem',
            } as React.CSSProperties
          }
        >
          <DashboardSidebar businessId={businessId} />
          <SidebarInset>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </HydrationBoundary>
  );
}
