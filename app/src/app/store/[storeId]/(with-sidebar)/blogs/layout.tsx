import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from '@tanstack/react-query';
import { ReactNode } from 'react';

import { getBlogsQueryOptions } from '@/features/blogs/_api/get-blogs';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ storeId: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { storeId } = await params;
  const qc = new QueryClient();

  await qc.prefetchQuery(getBlogsQueryOptions(storeId));

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
