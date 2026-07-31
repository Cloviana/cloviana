import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getBusinessQueryOptions } from '@/features/businesses/api/get-business';
import { getBusinessesQueryOptions } from '@/features/businesses/api/get-businesses';
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { DashboardSidebar } from '@/features/dashboard/components/dashboard-sidebar';
import { DashboardTheme } from '@/features/dashboard/components/dashboard-theme';
import { DASHBOARD_THEME_COOKIE } from '@/features/dashboard/components/dashboard-theme-cookie';
import { getQueryClient } from '@/lib/react-query/server';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
};

export default async function Layout({ children, params }: LayoutProps) {
  const { businessId } = await params;
  const queryClient = getQueryClient();

  const [cookieStore] = await Promise.all([
    cookies(),
    queryClient.prefetchQuery(getBusinessQueryOptions(businessId)),
    queryClient.prefetchQuery(getBusinessesQueryOptions()),
  ]);
  const themeCookie = cookieStore.get(DASHBOARD_THEME_COOKIE)?.value;
  const theme =
    themeCookie === 'light' || themeCookie === 'system' ? themeCookie : 'dark';

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardTheme initialTheme={theme}>
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
                '--sidebar-width': '18rem',
                '--sidebar-width-icon': '2.5rem',
              } as React.CSSProperties
            }
          >
            <DashboardSidebar businessId={businessId} />
            <SidebarInset>
              <div className="flex min-h-0 flex-1 flex-col">
                <DashboardHeader />
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </DashboardTheme>
    </HydrationBoundary>
  );
}
