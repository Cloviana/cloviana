import Link from 'next/link';

import {
  Page,
  PageBreadcrumbs,
  PageContent,
  PageHeader,
  PageHeaderRow,
  PageTitle,
} from '@/components/layout/page';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { paths } from '@/config/paths';
import { ProductForm } from '@/features/catalog';

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Page width="default" scroll="page">
      <PageHeader>
        <PageHeaderRow layout="stacked">
          <PageBreadcrumbs>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link href={paths.mp.products.getHref(slug)} />}
                  >
                    Products
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Add Product</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </PageBreadcrumbs>
          <PageTitle>Add Product</PageTitle>
        </PageHeaderRow>
      </PageHeader>
      <PageContent>
        <ProductForm slug={slug} />
      </PageContent>
    </Page>
  );
}
