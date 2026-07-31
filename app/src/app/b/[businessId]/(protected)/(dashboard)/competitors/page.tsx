import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { getCompetitorsQueryOptions } from '@/features/competitors/api/get-competitors';
import { AddCompetitorButton } from '@/features/competitors/components/add-competitor-button';
import { CompetitorsTable } from '@/features/competitors/components/competitors-table';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { getQueryClient } from '@/lib/react-query/server';

type PageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function CompetitorsPage({ params }: PageProps) {
  const { businessId } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(getCompetitorsQueryOptions(businessId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardPageLayout
        content="full"
        header={
          <PageHeader
            title="Competitors"
            actions={<AddCompetitorButton businessId={businessId} />}
          />
        }
      >
        <CompetitorsTable businessId={businessId} />
      </DashboardPageLayout>
    </HydrationBoundary>
  );
}
