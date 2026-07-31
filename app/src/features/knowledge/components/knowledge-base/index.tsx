'use client';

import { AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useGetDocuments } from '@/features/knowledge/api/get-documents';
import { useGetFolders } from '@/features/knowledge/api/get-folders';

import { FolderDetail } from './folder-detail';
import { FolderSidebar } from './folder-sidebar';
import { KnowledgeBaseSummary } from './knowledge-base-summary';

type KnowledgeBaseProps = {
  businessId: string;
};

export function KnowledgeBase({ businessId }: KnowledgeBaseProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>();
  const foldersQuery = useGetFolders(businessId);
  const folders = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data]);

  useEffect(() => {
    if (
      selectedFolderId &&
      folders.length > 0 &&
      !folders.some((folder) => folder.id === selectedFolderId)
    ) {
      setSelectedFolderId(undefined);
    }
  }, [folders, selectedFolderId]);

  const selectedFolder = useMemo(() => {
    const selected = folders.find((folder) => folder.id === selectedFolderId);
    return selected ?? folders[0];
  }, [folders, selectedFolderId]);

  const documentsQuery = useGetDocuments(businessId, selectedFolder?.id);
  const documents = documentsQuery.data ?? [];
  const documentCount = useMemo(
    () => folders.reduce((total, folder) => total + folder._count.documents, 0),
    [folders],
  );

  if (foldersQuery.isError && folders.length === 0) {
    return (
      <div className="border-border bg-card flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border px-6 text-center">
        <AlertCircle className="text-destructive size-5" />
        <div>
          <p className="text-sm font-medium">
            Could not load the knowledge base
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Check your connection and try again.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          loading={foldersQuery.isFetching}
          onClick={() => foldersQuery.refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <KnowledgeBaseSummary
        folderCount={folders.length}
        documentCount={documentCount}
      />

      <div className="border-border bg-card flex min-h-[32rem] flex-col overflow-hidden rounded-lg border md:flex-row">
        <FolderSidebar
          businessId={businessId}
          folders={folders}
          documents={documents}
          selectedFolderId={selectedFolder?.id}
          onSelectFolder={setSelectedFolderId}
          isLoading={foldersQuery.isLoading}
        />
        <FolderDetail
          businessId={businessId}
          folder={selectedFolder}
          folders={folders}
          documents={documents}
          isLoading={foldersQuery.isLoading}
          isDocumentsLoading={documentsQuery.isLoading}
          documentsError={documentsQuery.data ? null : documentsQuery.error}
          isRetryingDocuments={
            documentsQuery.isFetching && documentsQuery.isError
          }
          onSelectFolder={setSelectedFolderId}
          onFolderDeleted={() => setSelectedFolderId(undefined)}
          onRetryDocuments={() => documentsQuery.refetch()}
        />
      </div>
    </div>
  );
}
