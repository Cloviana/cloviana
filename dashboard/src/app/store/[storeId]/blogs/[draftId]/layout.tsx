import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { ReactNode } from 'react';

import { getBlogQueryOptions } from '@/api/blogs/get-blog';

interface LayoutProps {
  children: ReactNode;
  params: { storeId: string; draftId: string };
}

export default async function Layout({
  children,
  params: { draftId },
}: LayoutProps) {
  const qc = new QueryClient();
  await qc.prefetchQuery(getBlogQueryOptions(draftId));

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
