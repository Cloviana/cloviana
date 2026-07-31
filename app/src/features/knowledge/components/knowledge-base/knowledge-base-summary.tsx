type KnowledgeBaseSummaryProps = {
  folderCount: number;
  documentCount: number;
};

export function KnowledgeBaseSummary({
  folderCount,
  documentCount,
}: KnowledgeBaseSummaryProps) {
  return (
    <p className="text-muted-foreground text-sm">
      {folderCount} {folderCount === 1 ? 'folder' : 'folders'} · {documentCount}{' '}
      {documentCount === 1 ? 'document' : 'documents'}
    </p>
  );
}
