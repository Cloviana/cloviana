import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { paths } from '@/config/paths';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import {
  PageHeader,
  PageHeaderRow,
  PageHeaderTitle,
} from '@/features/dashboard/components/page-header';
import { getPromptQueryOptions } from '@/features/prompts/api/get-prompt';
import { getQueryClient } from '@/lib/react-query/server';

import { BrandPerceptionWidget } from './_components/brand-perception-widget';
import { FanOutQueriesWidget } from './_components/fan-out-queries-widget';
import { MentionRateWidget } from './_components/mention-rate-widget';
import { RankingWidget } from './_components/ranking-widget';
import { ResponsesWidget } from './_components/responses-widget';
import { SourceDistributionWidget } from './_components/source-distribution-widget';
import { BrandHoverProvider } from './_context/brand-hover-context';

type PageProps = {
  params: Promise<{ businessId: string; promptId: string }>;
};

export default async function PromptPage({ params }: PageProps) {
  const { businessId, promptId } = await params;
  const queryClient = getQueryClient();

  const prompt = await queryClient.ensureQueryData(
    getPromptQueryOptions(businessId, promptId),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardPageLayout
        header={
          <PageHeader className="border-b">
            <PageHeaderRow>
              <Breadcrumb className="min-w-0">
                <BreadcrumbList className="flex-nowrap">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={paths.business.prompts.getHref(businessId)}>
                        Prompts
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="truncate">
                      {prompt.text}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </PageHeaderRow>
            <PageHeaderRow className="gap-2">
              <PageHeaderTitle className="line-clamp-2">
                {prompt.text}
              </PageHeaderTitle>
              <Badge variant={prompt.active ? 'success' : 'muted'}>
                {prompt.active ? 'Active' : 'Inactive'}
              </Badge>
            </PageHeaderRow>
          </PageHeader>
        }
        layout="grid"
        width="padded"
      >
        <div className="col-span-12 flex flex-col gap-3.5">
          <BrandHoverProvider>
            <div className="grid grid-cols-12 items-stretch gap-3.5">
              <MentionRateWidget
                businessId={businessId}
                promptId={promptId}
                className="col-span-6"
              />
              <RankingWidget
                businessId={businessId}
                promptId={promptId}
                className="col-span-6"
              />
            </div>
          </BrandHoverProvider>
          <SourceDistributionWidget
            businessId={businessId}
            promptId={promptId}
          />
          <div className="grid grid-cols-12 items-stretch gap-3.5">
            <FanOutQueriesWidget
              businessId={businessId}
              promptId={promptId}
              className="col-span-6"
            />
            <BrandPerceptionWidget
              businessId={businessId}
              promptId={promptId}
              className="col-span-6"
            />
          </div>
          <ResponsesWidget businessId={businessId} promptId={promptId} />
        </div>
      </DashboardPageLayout>
    </HydrationBoundary>
  );
}
