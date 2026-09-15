import { BrandKitTabs } from '@/features/brand-kit/components/brand-kit-tabs';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import {
  PageHeader,
  PageHeaderRow,
  PageHeaderTitle,
} from '@/features/dashboard/components/page-header';

import { ContentTypesWidget } from './_widgets/content-types-widget';

type ContentTypesPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function ContentTypesPage({
  params,
}: ContentTypesPageProps) {
  const { businessId } = await params;

  return (
    <DashboardPageLayout
      layout="grid"
      header={
        <PageHeader>
          <PageHeaderRow>
            <PageHeaderTitle>Content Types</PageHeaderTitle>
          </PageHeaderRow>
          <PageHeaderRow>
            <BrandKitTabs businessId={businessId} />
          </PageHeaderRow>
        </PageHeader>
      }
    >
      <ContentTypesWidget businessId={businessId} className="col-span-12" />
    </DashboardPageLayout>
  );
}
