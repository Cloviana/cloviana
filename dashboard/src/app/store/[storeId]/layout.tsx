import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { paths } from '@/config/paths';
import { getStoreQueryOptions } from '@/features/stores/api/get-store';

interface LayoutProps {
  children: ReactNode;
  params: { storeId: string };
}

export default async function Layout({ children, params }: LayoutProps) {
  const { storeId } = params;
  const qc = new QueryClient();
  const store = await qc.ensureQueryData(getStoreQueryOptions(storeId));

  if (store.status === 'DRAFT') {
    redirect(paths.store.getHref());
  }

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
