import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { ReactNode } from 'react';

import { getBlogQueryOptions } from '@/features/blogs/api/get-blog';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{
    blogId: string;
  }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const qc = new QueryClient();

  const { blogId } = await params;

  await qc.prefetchQuery(getBlogQueryOptions(blogId));

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
