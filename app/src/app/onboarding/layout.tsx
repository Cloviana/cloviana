import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { OnboardingHeader } from '@/app/_components/header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { paths } from '@/config/paths';
import { getStoresQueryOptions } from '@/features/stores/api/get-stores';

interface LayoutProps {
  children: ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const qc = new QueryClient();
  const stores = await qc.ensureQueryData(getStoresQueryOptions());
  const activeStores = stores?.filter((s) => s.status !== 'DRAFT') ?? [];

  if (activeStores.length > 0) {
    redirect(paths.store.getHref());
  }

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <div className="bg-studio flex min-h-screen flex-col">
        <header className="border-b">
          <OnboardingHeader />
        </header>
        <ScrollArea className="relative flex-1">{children}</ScrollArea>
      </div>
    </HydrationBoundary>
  );
}
