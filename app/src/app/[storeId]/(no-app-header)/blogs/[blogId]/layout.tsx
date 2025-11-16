import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

import { getBlogQueryOptions } from '@/features/blogs/api/get-blog';

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{
    blogId: string;
    storeId: string;
  }>;
}) {
  const qc = new QueryClient();

  const { blogId, storeId } = await params;

  await qc.prefetchQuery(getBlogQueryOptions(storeId, blogId));

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
