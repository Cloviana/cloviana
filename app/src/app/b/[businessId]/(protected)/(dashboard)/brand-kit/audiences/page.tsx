import { BrandKitTabs } from '@/features/brand-kit/components/brand-kit-tabs';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import {
  PageHeader,
  PageHeaderRow,
  PageHeaderTitle,
} from '@/features/dashboard/components/page-header';

import { AudiencesWidget } from './_widgets/audiences-widget';

type AudiencesPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function AudiencesPage({ params }: AudiencesPageProps) {
  const { businessId } = await params;

  return (
    <DashboardPageLayout
      layout="grid"
      header={
        <PageHeader>
          <PageHeaderRow>
            <PageHeaderTitle>Audiences</PageHeaderTitle>
          </PageHeaderRow>
          <PageHeaderRow>
            <BrandKitTabs businessId={businessId} />
          </PageHeaderRow>
        </PageHeader>
      }
    >
      <AudiencesWidget businessId={businessId} className="col-span-12" />
    </DashboardPageLayout>
  );
}
