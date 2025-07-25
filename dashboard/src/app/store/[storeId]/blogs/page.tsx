import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

import { getBlogsQueryOptions } from '@/features/blogs/api/get-blogs';

import { Wrapper } from './_components';
import { BlogsTable } from './_components/blogs-table';

interface BlogsPageProps {
  params: { storeId: string };
}

export default async function BlogsPage({ params }: BlogsPageProps) {
  const qc = new QueryClient();
  const { storeId } = params;

  await qc.prefetchQuery(getBlogsQueryOptions(storeId));

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Wrapper>
        <BlogsTable />
      </Wrapper>
    </HydrationBoundary>
  );
}
