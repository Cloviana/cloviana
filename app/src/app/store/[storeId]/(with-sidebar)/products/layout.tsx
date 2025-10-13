import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from '@tanstack/react-query';
import { ReactNode } from 'react';

import { getProductsQueryOptions } from '@/api/products/get-products';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ storeId: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { storeId } = await params;
  const qc = new QueryClient();

  await qc.prefetchQuery(getProductsQueryOptions(storeId));

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
