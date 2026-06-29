import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';

import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import { getDocumentsQueryOptions } from '@/features/knowledge/api/get-documents';
import { Documents } from '@/features/knowledge/components/documents';

type PageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function KnowledgePage({ params }: PageProps) {
  const { businessId } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(getDocumentsQueryOptions(businessId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardPageLayout header={<DashboardHeader />}>
        <Suspense>
          <Documents businessId={businessId} />
        </Suspense>
      </DashboardPageLayout>
    </HydrationBoundary>
  );
}
