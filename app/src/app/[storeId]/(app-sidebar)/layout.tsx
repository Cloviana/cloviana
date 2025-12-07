import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AppSidebar } from '@/app/_components/sidebar';
import { ErrorFallback } from '@/components/fallbacks/error-fallback';
import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ShopifyConnectionGate } from '@/features/stores/guards/shopify-connection-gate';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '18rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar />

      <SidebarInset>
        <ScrollArea className="h-full flex-1">
          <Suspense fallback={<LoadingFallback />}>
            <ErrorBoundary fallback={<ErrorFallback />}>
              <ShopifyConnectionGate>{children}</ShopifyConnectionGate>
            </ErrorBoundary>
          </Suspense>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
