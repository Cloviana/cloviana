import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import {
  PageHeader,
  PageHeaderRow,
  PageHeaderTitle,
} from '@/features/dashboard/components/page-header';
import { PromptsTabs } from '@/features/prompts/components/prompts-tabs';
import { ResponsesTable } from '@/features/prompts/components/responses-table';
import { ResponsesFilterRow } from '@/features/prompts/components/responses-table/filter-row';
import { ResponsesPagination } from '@/features/prompts/components/responses-table/pagination';

type ResponsesPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function ResponsesPage({ params }: ResponsesPageProps) {
  const { businessId } = await params;

  return (
    <DashboardPageLayout
      width="full"
      header={
        <PageHeader>
          <PageHeaderRow>
            <PageHeaderTitle>Responses</PageHeaderTitle>
          </PageHeaderRow>
          <PageHeaderRow>
            <PromptsTabs businessId={businessId} />
          </PageHeaderRow>
        </PageHeader>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <ResponsesFilterRow />
        <ResponsesTable />
        <ResponsesPagination />
      </div>
    </DashboardPageLayout>
  );
}
