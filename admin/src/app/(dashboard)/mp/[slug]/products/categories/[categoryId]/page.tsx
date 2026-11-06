import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';

import {
  Page,
  PageActions,
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
import { CategoryForm, CategoryPageActions } from '@/features/catalog';
import { findCategory } from '@/features/catalog/categories/server';

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string; categoryId: string }>;
}) {
  const { slug, categoryId } = await params;
  const category = await findCategory(slug, categoryId);
  if (!category) notFound();

  // The path runs from the top-level category down to this one.
  const ancestors = category.path.slice(0, -1);

  return (
    <Page width="narrow" scroll="page">
      <PageHeader>
        <PageHeaderRow layout="stacked">
          <PageBreadcrumbs>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link href={paths.mp.categories.getHref(slug)} />}
                  >
                    Categories
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {ancestors.map((ancestor) => (
                  <Fragment key={ancestor.id}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        render={
                          <Link
                            href={paths.mp.categories.edit.getHref(
                              slug,
                              ancestor.id,
                            )}
                          />
                        }
                      >
                        {ancestor.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </Fragment>
                ))}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{category.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </PageBreadcrumbs>
          <div className="flex w-full flex-wrap items-center gap-2">
            <PageTitle>Edit category</PageTitle>
            <PageActions>
              <CategoryPageActions slug={slug} category={category} />
            </PageActions>
          </div>
        </PageHeaderRow>
      </PageHeader>
      <PageContent>
        <CategoryForm slug={slug} category={category} />
      </PageContent>
    </Page>
  );
}
