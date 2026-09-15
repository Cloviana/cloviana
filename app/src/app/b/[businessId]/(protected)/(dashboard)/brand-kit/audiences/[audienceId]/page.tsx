import { BrandKitDetailHeader } from '@/features/brand-kit/components/brand-kit-detail-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';

import { SampleAssignmentsWidget } from '../../_widgets/sample-assignments-widget';
import { WritingRulesWidget } from '../../_widgets/writing-rules-widget';

import { AudienceDetailsWidget } from './_widgets/audience-details-widget';

type AudiencePageProps = {
  params: Promise<{ businessId: string; audienceId: string }>;
};

export default async function AudiencePage({ params }: AudiencePageProps) {
  const { businessId, audienceId } = await params;

  return (
    <DashboardPageLayout
      layout="grid"
      header={
        <BrandKitDetailHeader
          businessId={businessId}
          detailId={audienceId}
          type="audience"
        />
      }
    >
      <AudienceDetailsWidget audienceId={audienceId} className="col-span-12" />
      <SampleAssignmentsWidget
        scope="audience"
        scopeId={audienceId}
        className="col-span-12"
      />
      <WritingRulesWidget
        scope="AUDIENCE"
        scopeId={audienceId}
        className="col-span-12"
      />
    </DashboardPageLayout>
  );
}
