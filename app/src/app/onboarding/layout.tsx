import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { getStoresQueryOptions } from '@/api/stores/get-stores';
import { OnboardingHeader } from '@/app/_components/header';
import { paths } from '@/config/paths';

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
      <div className="flex min-h-screen flex-col bg-white">
        <OnboardingHeader />
        <main className="bg-background flex flex-1 overflow-y-auto rounded-t-2xl border">
          {children}
        </main>
      </div>
    </HydrationBoundary>
  );
}
