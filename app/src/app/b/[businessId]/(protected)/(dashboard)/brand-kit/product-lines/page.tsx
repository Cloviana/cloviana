import { BrandKitTabs } from '@/features/brand-kit/components/brand-kit-tabs';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import {
  PageHeader,
  PageHeaderRow,
  PageHeaderTitle,
} from '@/features/dashboard/components/page-header';

import { ProductsWidget } from './_widgets/products-widget';

type ProductLinesPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function ProductLinesPage({
  params,
}: ProductLinesPageProps) {
  const { businessId } = await params;

  return (
    <DashboardPageLayout
      layout="grid"
      header={
        <PageHeader>
          <PageHeaderRow className="gap-4">
            <PageHeaderTitle>Products</PageHeaderTitle>
          </PageHeaderRow>
          <PageHeaderRow>
            <BrandKitTabs businessId={businessId} />
          </PageHeaderRow>
        </PageHeader>
      }
    >
      <ProductsWidget businessId={businessId} className="col-span-12" />
    </DashboardPageLayout>
  );
}
