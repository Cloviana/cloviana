import { BrandKitTabs } from '@/features/brand-kit/components/brand-kit-tabs';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import {
  PageHeader,
  PageHeaderRow,
  PageHeaderTitle,
} from '@/features/dashboard/components/page-header';

import { RegionsWidget } from './_widgets/regions-widget';

type RegionsPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function RegionsPage({ params }: RegionsPageProps) {
  const { businessId } = await params;

  return (
    <DashboardPageLayout
      layout="grid"
      header={
        <PageHeader>
          <PageHeaderRow>
            <PageHeaderTitle>Regions</PageHeaderTitle>
          </PageHeaderRow>
          <PageHeaderRow>
            <BrandKitTabs businessId={businessId} />
          </PageHeaderRow>
        </PageHeader>
      }
    >
      <RegionsWidget businessId={businessId} className="col-span-12" />
    </DashboardPageLayout>
  );
}
