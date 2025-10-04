import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { ReactNode } from 'react';

import { getBlogQueryOptions } from '@/api/blogs/get-blog';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ storeId: string; draftId: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const qc = new QueryClient();

  const { draftId } = await params;

  await qc.prefetchQuery(getBlogQueryOptions(draftId));

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
