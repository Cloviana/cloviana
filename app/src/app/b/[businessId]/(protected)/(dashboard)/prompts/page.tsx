import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderRow,
  PageHeaderTitle,
} from '@/features/dashboard/components/page-header';
import { CreatePromptButton } from '@/features/prompts/components/create-prompt-button';
import { PromptsTable } from '@/features/prompts/components/prompts-table';
import { PromptsFilterRow } from '@/features/prompts/components/prompts-table/filter-row';
import { PromptsPagination } from '@/features/prompts/components/prompts-table/pagination';
import { PromptsTabs } from '@/features/prompts/components/prompts-tabs';

type PromptsPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function PromptsPage({ params }: PromptsPageProps) {
  const { businessId } = await params;

  return (
    <DashboardPageLayout
      width="full"
      header={
        <PageHeader>
          <PageHeaderRow className="justify-between gap-4">
            <PageHeaderTitle>Prompts</PageHeaderTitle>
            <PageHeaderActions>
              <CreatePromptButton />
            </PageHeaderActions>
          </PageHeaderRow>
          <PageHeaderRow>
            <PromptsTabs businessId={businessId} />
          </PageHeaderRow>
        </PageHeader>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <PromptsFilterRow />
        <PromptsTable />
        <PromptsPagination />
      </div>
    </DashboardPageLayout>
  );
}
