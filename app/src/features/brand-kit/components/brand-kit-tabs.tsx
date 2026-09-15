import { paths } from '@/config/paths';
import { PageTabs } from '@/features/dashboard/components/page-tabs';

type BrandKitTabsProps = {
  businessId: string;
};

export function BrandKitTabs({ businessId }: BrandKitTabsProps) {
  return (
    <PageTabs
      tabs={[
        {
          value: 'foundations',
          label: 'Brand',
          href: paths.business.brandKit.foundations.getHref(businessId),
        },
        {
          value: 'product-lines',
          label: 'Products',
          href: paths.business.brandKit.productLines.getHref(businessId),
        },
        {
          value: 'content-types',
          label: 'Content Types',
          href: paths.business.brandKit.contentTypes.getHref(businessId),
        },
        {
          value: 'audiences',
          label: 'Audiences',
          href: paths.business.brandKit.audiences.getHref(businessId),
        },
        {
          value: 'regions',
          label: 'Regions',
          href: paths.business.brandKit.regions.getHref(businessId),
        },
      ]}
    />
  );
}
