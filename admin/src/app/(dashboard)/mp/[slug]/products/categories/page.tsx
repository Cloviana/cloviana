import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import {
  Page,
  PageActions,
  PageContent,
  PageHeader,
  PageHeaderRow,
  PageTitle,
} from '@/components/layout/page';
import {
  AddCategoryButton,
  CategoriesSearch,
  CategoriesTable,
  categoryPagesQueryOptions,
} from '@/features/catalog';
import { getQueryClient } from '@/lib/react-query/server';

export default async function ProductCategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;
  const term = typeof q === 'string' ? q.trim() : '';

  // Prefetched so the client table (useCategoryLevel) hydrates with data and does not refetch on load.
  // A failed prefetch just means the client fetches it itself. The search needs two characters, as in the table.
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    categoryPagesQueryOptions(slug, {
      search: term.length >= 2 ? term : undefined,
      includeHidden: true,
    }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Page width="full">
        <PageHeader>
          <PageHeaderRow>
            <PageTitle>Categories</PageTitle>
            <PageActions>
              <AddCategoryButton size="sm" />
            </PageActions>
          </PageHeaderRow>
          <PageHeaderRow>
            <CategoriesSearch />
          </PageHeaderRow>
        </PageHeader>
        <PageContent className="pr-6">
          <CategoriesTable slug={slug} />
        </PageContent>
      </Page>
    </HydrationBoundary>
  );
}
