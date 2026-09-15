import { BrandKitDetailHeader } from '@/features/brand-kit/components/brand-kit-detail-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';

import { SampleAssignmentsWidget } from '../../_widgets/sample-assignments-widget';
import { WritingRulesWidget } from '../../_widgets/writing-rules-widget';

import { RegionDetailsWidget } from './_widgets/region-details-widget';

type RegionPageProps = {
  params: Promise<{ businessId: string; regionId: string }>;
};

export default async function RegionPage({ params }: RegionPageProps) {
  const { businessId, regionId } = await params;

  return (
    <DashboardPageLayout
      layout="grid"
      header={
        <BrandKitDetailHeader
          businessId={businessId}
          detailId={regionId}
          type="region"
        />
      }
    >
      <RegionDetailsWidget regionId={regionId} className="col-span-12" />
      <SampleAssignmentsWidget
        scope="region"
        scopeId={regionId}
        className="col-span-12"
      />
      <WritingRulesWidget
        scope="REGION"
        scopeId={regionId}
        className="col-span-12"
      />
    </DashboardPageLayout>
  );
}
