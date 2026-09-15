import { BrandKitDetailHeader } from '@/features/brand-kit/components/brand-kit-detail-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';

import { CompetitorsWidget } from './_widgets/competitors-widget';
import { ProductDetailsWidget } from './_widgets/product-details-widget';

type ProductPageProps = {
  params: Promise<{ businessId: string; productId: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { businessId, productId } = await params;

  return (
    <DashboardPageLayout
      layout="grid"
      header={
        <BrandKitDetailHeader
          businessId={businessId}
          detailId={productId}
          type="product"
        />
      }
    >
      <ProductDetailsWidget productId={productId} />
      <CompetitorsWidget
        businessId={businessId}
        productId={productId}
        className="col-span-12"
      />
    </DashboardPageLayout>
  );
}
