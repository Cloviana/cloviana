import { BrandKitDetailHeader } from '@/features/brand-kit/components/brand-kit-detail-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';

import { WritingRulesWidget } from '../../_widgets/writing-rules-widget';

import { CtaWidget } from './_widgets/cta-widget';
import { SamplesWidget } from './_widgets/samples-widget';

type ContentTypePageProps = {
  params: Promise<{ businessId: string; contentTypeId: string }>;
};

export default async function ContentTypePage({
  params,
}: ContentTypePageProps) {
  const { businessId, contentTypeId } = await params;

  return (
    <DashboardPageLayout
      layout="grid"
      header={
        <BrandKitDetailHeader
          businessId={businessId}
          detailId={contentTypeId}
          type="contentType"
        />
      }
    >
      <SamplesWidget contentTypeId={contentTypeId} className="col-span-12" />
      <CtaWidget contentTypeId={contentTypeId} className="col-span-12" />
      <WritingRulesWidget
        scope="CONTENT_TYPE"
        scopeId={contentTypeId}
        className="col-span-12"
      />
    </DashboardPageLayout>
  );
}
