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
  CreateStoreButton,
  StoresFilters,
  StoresTable,
  storeFilters,
  storesQueryOptions,
  toStoresParams,
} from '@/features/vendors';
import { readFilterState } from '@/lib/filters';
import { getQueryClient } from '@/lib/react-query/server';

export default async function StoresPage({
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
  // Prefetched so the client table (useStores) hydrates with data and does not refetch on load.
  // A failed prefetch also just means the client fetches it itself.
  const queryClient = getQueryClient();
  const filters = readFilterState(storeFilters, urlParams);
  await queryClient
    .query(storesQueryOptions(slug, toStoresParams(filters)))
    .catch(() => undefined);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Page width="full">
        <PageHeader>
          <PageHeaderRow>
            <PageTitle>Stores</PageTitle>
            <PageActions>
              <CreateStoreButton slug={slug} size="sm" />
            </PageActions>
          </PageHeaderRow>
          <PageHeaderRow>
            <StoresFilters slug={slug} />
          </PageHeaderRow>
        </PageHeader>
        <PageContent className="pr-6">
          <StoresTable slug={slug} />
        </PageContent>
      </Page>
    </HydrationBoundary>
  );
}
