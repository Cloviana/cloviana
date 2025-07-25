import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { ReactNode } from 'react';

import { getBlogQueryOptions } from '@/features/blogs/api/get-blog';

interface LayoutProps {
  children: ReactNode;
  params: {
    blogId: string;
  };
}

export default async function Layout({
  children,
  params: { blogId },
}: LayoutProps) {
  const qc = new QueryClient();
  await qc.prefetchQuery(getBlogQueryOptions(blogId));

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
