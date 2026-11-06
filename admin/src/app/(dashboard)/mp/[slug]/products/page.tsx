import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import {
  Page,
  PageActions,
  PageContent,
  PageHeader,
  PageHeaderRow,
  PageTitle,
} from '@/components/layout/page';
import { paths } from '@/config/paths';
import {
  AddProductButton,
  ProductsFilters,
  ProductsTable,
  productFilters,
  productsQueryOptions,
  toProductsParams,
} from '@/features/catalog';
import { readFilterState } from '@/lib/filters';
import { getQueryClient } from '@/lib/react-query/server';

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (Array.isArray(value))
      value.forEach((entry) => urlParams.append(key, entry));
    else if (value !== undefined) urlParams.set(key, value);
  }
  if (
    search.action === 'edit-product' &&
    typeof search.productId === 'string' &&
    search.productId
  ) {
    urlParams.delete('action');
    urlParams.delete('productId');
    redirect(paths.mp.products.edit.getHref(slug, search.productId, urlParams));
  }
  // Prefetched so the client table (useProducts) hydrates with data and does not refetch on load.
  const queryClient = getQueryClient();
  const filters = readFilterState(productFilters, urlParams);
  // Date filters mean days in the browser's time zone, which the server doesn't know, so the client fetches those itself.
  // A failed prefetch also just means the client fetches it itself.
  if (!filters.values.updated && !filters.values.created) {
    await queryClient
      .query(productsQueryOptions(slug, toProductsParams(filters)))
      .catch(() => undefined);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Page width="full">
        <PageHeader>
          <PageHeaderRow>
            <PageTitle>Products</PageTitle>
            <PageActions>
              <AddProductButton size="sm" />
            </PageActions>
          </PageHeaderRow>
          <PageHeaderRow>
            <ProductsFilters slug={slug} />
          </PageHeaderRow>
        </PageHeader>
        <PageContent className="pr-6">
          <ProductsTable slug={slug} now={Date.now()} />
        </PageContent>
      </Page>
    </HydrationBoundary>
  );
}
