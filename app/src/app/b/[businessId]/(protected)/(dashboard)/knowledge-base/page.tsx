import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import { getFoldersQueryOptions } from '@/features/knowledge/api/get-folders';
import { KnowledgeBase } from '@/features/knowledge/components/knowledge-base';
import { getQueryClient } from '@/lib/react-query/server';

type PageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function KnowledgeBasePage({ params }: PageProps) {
  const { businessId } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(getFoldersQueryOptions(businessId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardPageLayout>
        <KnowledgeBase businessId={businessId} />
      </DashboardPageLayout>
    </HydrationBoundary>
  );
}
