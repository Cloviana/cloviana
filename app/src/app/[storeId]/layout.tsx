import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { getStoreQueryOptions } from '@/api/stores/get-store';
import { getStoresQueryOptions } from '@/api/stores/get-stores';
import { paths } from '@/config/paths';
import { SubscriptionModal } from '@/features/billing/components/subscription-modal';
import { SubscriptionModalProvider } from '@/stores/subscription-modal';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ storeId: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { storeId } = await params;

  const qc = new QueryClient();
  const [stores, store] = await Promise.all([
    qc.ensureQueryData(getStoresQueryOptions()),
    qc.ensureQueryData(getStoreQueryOptions(storeId)),
  ]);
  const activeStores = stores?.filter((s) => s.status !== 'DRAFT') ?? [];

  if (activeStores.length === 0) {
    redirect(paths.onboarding.companyDetail.getHref());
  } else if (activeStores.length && !store) {
    redirect(paths.store.blogs.getHref(activeStores[0].id));
  }

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <SubscriptionModalProvider>
        {children}
        <SubscriptionModal />
      </SubscriptionModalProvider>
    </HydrationBoundary>
  );
}
