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
import { CreateStoreForm } from '@/features/vendors';

export default async function NewStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Page width="narrow" scroll="page">
      <PageHeader>
        <PageHeaderRow layout="stacked">
          <PageBreadcrumbs>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link href={paths.mp.stores.getHref(slug)} />}
                  >
                    Stores
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Add store</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </PageBreadcrumbs>
          <PageTitle>Add store</PageTitle>
        </PageHeaderRow>
      </PageHeader>
      <PageContent>
        <CreateStoreForm slug={slug} />
      </PageContent>
    </Page>
  );
}
