import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import {
  Page,
  PageContent,
  PageHeader,
  PageHeaderRow,
  PageTitle,
} from '@/components/layout/page';
import { ThemesList } from '@/features/themes/components/themes-list';
import { themesQueryOptions } from '@/features/themes/queries';
import { getQueryClient } from '@/lib/react-query/server';

export default async function ThemesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Prefetched so the client list hydrates with data; a failed prefetch just means the client fetches it itself.
  const queryClient = getQueryClient();
  await queryClient.query(themesQueryOptions(slug)).catch(() => undefined);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Page>
        <PageHeader>
          <PageHeaderRow>
            <PageTitle>Themes</PageTitle>
          </PageHeaderRow>
        </PageHeader>
        <PageContent>
          <ThemesList slug={slug} />
        </PageContent>
      </Page>
    </HydrationBoundary>
  );
}
