import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderRow,
  PageHeaderTitle,
} from '@/features/dashboard/components/page-header';
import { FolderSidebar } from '@/features/knowledge/components/folder-sidebar';
import { KnowledgeDropzone } from '@/features/knowledge/components/knowledge-dropzone';
import { KnowledgeTable } from '@/features/knowledge/components/knowledge-table';
import { NewFolderButton } from '@/features/knowledge/components/new-folder-button';
import { UploadButton } from '@/features/knowledge/components/upload-button';

type PageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function KnowledgeBasePage({ params }: PageProps) {
  const { businessId } = await params;

  return (
    <DashboardPageLayout
      width="full"
      header={
        <PageHeader className="border-b">
          <PageHeaderRow className="justify-between gap-4">
            <PageHeaderTitle>Knowledge Base</PageHeaderTitle>
            <PageHeaderActions>
              <NewFolderButton businessId={businessId} />
              <UploadButton businessId={businessId} />
            </PageHeaderActions>
          </PageHeaderRow>
        </PageHeader>
      }
    >
      <div className="flex min-h-0 flex-1">
        <FolderSidebar businessId={businessId} />
        {/* Drop target is the table pane only — the rail is not a drop area. */}
        <KnowledgeDropzone businessId={businessId}>
          <KnowledgeTable businessId={businessId} />
        </KnowledgeDropzone>
      </div>
    </DashboardPageLayout>
  );
}
