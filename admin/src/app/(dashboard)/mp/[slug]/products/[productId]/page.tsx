import Link from 'next/link';
import { notFound } from 'next/navigation';

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
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { ProductForm, ProductPageActions } from '@/features/catalog';
import { getProduct } from '@/features/catalog/products/server';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;
  const product = await getProduct(slug, productId);
  if (!product) notFound();

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
                  <BreadcrumbPage>{product.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </PageBreadcrumbs>
          <div className="flex w-full flex-wrap items-center gap-2">
            <PageTitle>Edit Product</PageTitle>
            <PageActions>
              <Button
                variant="outline"
                nativeButton={false}
                render={
                  <a
                    href={`https://${slug}.cloviana.com/products/${encodeURIComponent(product.handle)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                Preview
              </Button>
              <ProductPageActions
                slug={slug}
                productId={product.id}
                status={product.status}
                canDelete={product.canDelete}
              />
            </PageActions>
          </div>
        </PageHeaderRow>
      </PageHeader>
      <PageContent>
        <ProductForm key={product.status} slug={slug} product={product} />
      </PageContent>
    </Page>
  );
}
