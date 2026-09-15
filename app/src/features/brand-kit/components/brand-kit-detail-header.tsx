'use client';

import Link from 'next/link';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { paths } from '@/config/paths';
import {
  PageHeader,
  PageHeaderRow,
  PageHeaderTitle,
} from '@/features/dashboard/components/page-header';

import { useBrandKitDraft } from '../context/brand-kit-draft-context';

type DetailType = 'product' | 'contentType' | 'audience' | 'region';

type BrandKitDetailHeaderProps = {
  businessId: string;
  detailId: string;
  type: DetailType;
};

export function BrandKitDetailHeader({
  businessId,
  detailId,
  type,
}: BrandKitDetailHeaderProps) {
  const { draft } = useBrandKitDraft();
  const detail = getDetail(draft, type, detailId);

  return (
    <PageHeader className="border-b">
      <PageHeaderRow>
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={paths.business.brandKit.getHref(businessId)}>
                  Brand Kit
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={detail.listHref(businessId)}>
                  {detail.listLabel}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">
                {detail.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeaderRow>
      <PageHeaderRow>
        <PageHeaderTitle className="truncate">{detail.name}</PageHeaderTitle>
      </PageHeaderRow>
    </PageHeader>
  );
}

function getDetail(
  draft: ReturnType<typeof useBrandKitDraft>['draft'],
  type: DetailType,
  detailId: string,
) {
  switch (type) {
    case 'product':
      return {
        name:
          draft.products.find((item) => item.id === detailId)?.name ??
          'Product',
        listLabel: 'Products',
        listHref: paths.business.brandKit.productLines.getHref,
      };
    case 'contentType':
      return {
        name:
          draft.contentTypes.find((item) => item.id === detailId)?.name ??
          'Content Type',
        listLabel: 'Content Types',
        listHref: paths.business.brandKit.contentTypes.getHref,
      };
    case 'audience':
      return {
        name:
          draft.audiences.find((item) => item.id === detailId)?.name ??
          'Audience',
        listLabel: 'Audiences',
        listHref: paths.business.brandKit.audiences.getHref,
      };
    case 'region':
      return {
        name:
          draft.regions.find((item) => item.id === detailId)?.name ?? 'Region',
        listLabel: 'Regions',
        listHref: paths.business.brandKit.regions.getHref,
      };
  }
}
