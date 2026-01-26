import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';
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

  const blog = await qc.ensureQueryData(getBlogQueryOptions(storeId, blogId));

  if (!blog || blog.currentStep !== 'COMPLETED') {
    redirect(paths.store.blogs.getHref(storeId, blogId));
  }

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
