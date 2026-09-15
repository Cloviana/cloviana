'use client';

import { useMemo, useState, type DragEvent } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeading,
  TableEmptyValue,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Document } from '@/types/api';
import { cn } from '@/utils/cn';
import { formatDateToMonthDate, formatWithDateFns } from '@/utils/format';

import { useGetDocuments } from '../api/get-documents';
import { getKnowledgeError } from '../api/knowledge-error';
import { useUpdateDocument } from '../api/update-document';
import { useSelectedFolder } from '../hooks/use-selected-folder';
import {
  getDraggedDocumentId,
  isDocumentDrag,
  startDocumentDrag,
} from '../utils/drag';

import { DocumentActions } from './document-actions';
import { FileIcon, FolderClosedIcon } from './file-type-icons';

// Single source of truth for the column layout: the header cells and the
// table's minimum width are both derived from this.
const COLUMNS: Array<{ label: string; width: number; tooltip?: string }> = [
  { label: 'Name', width: 520 },
  { label: 'Size', width: 140 },
  {
    label: 'Added',
    width: 180,
    tooltip: 'When the folder or document was added to this knowledge base.',
  },
  { label: '', width: 64 },
];

const TABLE_MIN_WIDTH = COLUMNS.reduce((total, { width }) => total + width, 0);

const EMPTY_DOCUMENTS: Document[] = [];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

/** Compact date in the cell, exact timestamp on hover. */
function AddedCell({ value }: { value: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default">{formatDateToMonthDate(value)}</span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {formatWithDateFns(value)}
      </TooltipContent>
    </Tooltip>
  );
}

type KnowledgeTableProps = {
  businessId: string;
};

export function KnowledgeTable({ businessId }: KnowledgeTableProps) {
  const { folder, folders, selectFolder } = useSelectedFolder(businessId);
  const documentsQuery = useGetDocuments(businessId);
  const updateDocument = useUpdateDocument();
  const [dropTargetId, setDropTargetId] = useState<string>();

  const subfolders = useMemo(
    () =>
      folders
        .filter((item) => folder && item.parentId === folder.id)
        .sort(
          (a, b) => a.position - b.position || a.name.localeCompare(b.name),
        ),
    [folders, folder],
  );

  const documents = useMemo(
    () =>
      (documentsQuery.data ?? EMPTY_DOCUMENTS)
        .filter((item) => folder && item.folderId === folder.id)
        .sort((a, b) => a.position - b.position),
    [documentsQuery.data, folder],
  );

  const handleFolderDrop = (
    event: DragEvent<HTMLElement>,
    targetFolderId: string,
  ) => {
    event.preventDefault();
    setDropTargetId(undefined);
    const documentId = getDraggedDocumentId(event);
    if (!documentId) return;

    updateDocument.mutate(
      { businessId, documentId, folderId: targetFolderId },
      { onError: (error) => toast.error(getKnowledgeError(error)) },
    );
  };

  if (documentsQuery.isLoading) {
    return (
      <div className="bg-surface flex min-h-0 flex-1 items-center justify-center">
        <Spinner variant="1" className="text-muted-foreground size-5" />
      </div>
    );
  }

  if (documentsQuery.isError && documents.length === 0) {
    return (
      <div className="bg-surface text-destructive flex min-h-0 flex-1 items-center justify-center text-sm">
        Could not load documents.
      </div>
    );
  }

  const isEmpty = subfolders.length === 0 && documents.length === 0;

  return (
    <div className="no-scrollbar bg-surface flex min-h-0 flex-1 flex-col overflow-y-auto">
      <Table
        className="table-fixed text-[13px]"
        style={{ minWidth: TABLE_MIN_WIDTH }}
      >
        <TableCaption className="sr-only">
          Folders and documents in {folder?.name ?? 'this folder'}.
        </TableCaption>

        {/* No top border — the table sits directly under the page header. */}
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((column) => (
              <TableHead key={column.label} style={{ width: column.width }}>
                <TableColumnHeading
                  label={column.label}
                  tooltip={column.tooltip}
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody className="[&_tr:last-child]:border-b">
          {subfolders.map((subfolder) => (
            <TableRow
              key={subfolder.id}
              className={cn(
                'group h-14',
                dropTargetId === subfolder.id && 'bg-accent',
              )}
              onDragOver={(event) => {
                if (!isDocumentDrag(event)) return;
                event.preventDefault();
                setDropTargetId(subfolder.id);
              }}
              onDragLeave={() => setDropTargetId(undefined)}
              onDrop={(event) => handleFolderDrop(event, subfolder.id)}
            >
              <TableCell>
                <button
                  type="button"
                  onClick={() => selectFolder(subfolder.id)}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <FolderClosedIcon />
                  <span className="truncate font-medium">{subfolder.name}</span>
                </button>
              </TableCell>
              <TableCell>
                <TableEmptyValue />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <AddedCell value={subfolder.createdAt} />
              </TableCell>
              <TableCell />
            </TableRow>
          ))}

          {documents.map((document) => (
            <TableRow
              key={document.id}
              className="group h-14"
              draggable
              onDragStart={(event) => startDocumentDrag(event, document.id)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <FileIcon extension={document.extension} />
                  <span className="truncate font-medium">{document.name}</span>
                  {/* txt and md share a glyph, so the extension is what tells
                      them apart — and it reads without relying on colour. */}
                  <span className="text-muted-foreground shrink-0 text-[11px] uppercase">
                    {document.extension}
                  </span>
                  {/* Ingestion is async and has no failure state — a document
                      that fails is removed. Only surface the in-flight ones. */}
                  {document.status !== 'READY' && (
                    <Badge variant="muted" size="sm">
                      {document.status === 'PROCESSING'
                        ? 'Processing'
                        : 'Queued'}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="tabular-nums">
                {formatFileSize(document.sizeBytes)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <AddedCell value={document.createdAt} />
              </TableCell>
              <TableCell>
                <DocumentActions
                  businessId={businessId}
                  document={document}
                  folders={folders}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {isEmpty && (
        <Empty className="bg-surface min-h-0 rounded-none">
          <EmptyHeader>
            <EmptyTitle>No documents yet</EmptyTitle>
            <EmptyDescription>
              Drop PDF, DOCX, Markdown, or TXT files here to add them to{' '}
              {folder?.name ?? 'this folder'}.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
