'use client';

import { Check, Copy } from 'lucide-react';
import { type DragEvent, useState } from 'react';
import { toast } from 'sonner';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDeleteDocument } from '@/features/knowledge/api/delete-document';
import { getKnowledgeError } from '@/features/knowledge/api/knowledge-error';
import { useUpdateDocument } from '@/features/knowledge/api/update-document';
import type { Document } from '@/types/api';
import { cn } from '@/utils/cn';

import { DeleteDocumentDialog } from './delete-document-dialog';
import { DocumentActionsMenu } from './document-actions-menu';
import { DOCUMENT_DRAG_TYPE } from './document-drag';
import {
  formatDate,
  formatFileSize,
  formatFullDate,
} from './document-formatters';

type DocumentsListProps = {
  businessId: string;
  documents: Document[];
  actionsDisabled?: boolean;
};

function ReorderDotsIcon() {
  return (
    <svg
      viewBox="-2.4 -2.4 28.8 28.8"
      aria-hidden="true"
      className="text-muted-foreground size-4 opacity-40 group-hover/row:opacity-100"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M7.5 0a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7m0 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7m0 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7m9-17a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7m0 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7m0 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function DocumentsList({
  businessId,
  documents,
  actionsDisabled = false,
}: DocumentsListProps) {
  const [documentToDeleteId, setDocumentToDeleteId] = useState<string>();
  const [copiedDocumentId, setCopiedDocumentId] = useState<string>();
  const [draggedDocumentId, setDraggedDocumentId] = useState<string>();
  const [dropTarget, setDropTarget] = useState<{
    documentId: string;
    edge: 'before' | 'after';
  }>();
  const updateDocument = useUpdateDocument(businessId);
  const deleteDocument = useDeleteDocument();
  const documentToDelete = documents.find(
    (document) => document.id === documentToDeleteId,
  );
  async function remove() {
    if (!documentToDelete || deleteDocument.isPending) return;
    try {
      await deleteDocument.mutateAsync({
        businessId,
        documentId: documentToDelete.id,
      });
      toast.success('Document deleted');
      setDocumentToDeleteId(undefined);
    } catch (error) {
      toast.error(getKnowledgeError(error, 'Could not delete document'));
    }
  }

  async function copyDocumentId(documentId: string) {
    try {
      await navigator.clipboard.writeText(documentId);
      setCopiedDocumentId(documentId);
      window.setTimeout(() => setCopiedDocumentId(undefined), 1_500);
    } catch {
      toast.error('Could not copy the document ID');
    }
  }

  function startDragging(
    event: DragEvent<HTMLTableRowElement>,
    documentId: string,
  ) {
    if (
      actionsDisabled ||
      (event.target as HTMLElement).closest(
        'button, a, input, select, textarea, [role="button"]',
      )
    ) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(DOCUMENT_DRAG_TYPE, documentId);
    event.dataTransfer.setData('text/plain', documentId);
    setDraggedDocumentId(documentId);
  }

  function dragOver(event: DragEvent<HTMLTableRowElement>, documentId: string) {
    if (!draggedDocumentId || draggedDocumentId === documentId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const bounds = event.currentTarget.getBoundingClientRect();
    const edge =
      event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after';
    setDropTarget({ documentId, edge });
  }

  async function drop(
    event: DragEvent<HTMLTableRowElement>,
    documentId: string,
  ) {
    event.preventDefault();
    const sourceDocumentId =
      draggedDocumentId || event.dataTransfer.getData(DOCUMENT_DRAG_TYPE);
    const sourceIndex = documents.findIndex(
      (document) => document.id === sourceDocumentId,
    );
    const targetIndex = documents.findIndex(
      (document) => document.id === documentId,
    );
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      setDropTarget(undefined);
      return;
    }

    const edge =
      dropTarget?.documentId === documentId ? dropTarget.edge : 'before';
    let position = targetIndex + (edge === 'after' ? 1 : 0);
    if (sourceIndex < position) position -= 1;
    if (position !== sourceIndex) {
      await reorderDocument(sourceDocumentId, position);
    }
    setDraggedDocumentId(undefined);
    setDropTarget(undefined);
  }

  function stopDragging() {
    setDraggedDocumentId(undefined);
    setDropTarget(undefined);
  }

  async function reorderDocument(documentId: string, position: number) {
    if (actionsDisabled) return;
    try {
      await updateDocument.mutateAsync({ businessId, documentId, position });
    } catch (error) {
      toast.error(getKnowledgeError(error, 'Could not reorder document'));
    }
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <Table className="table-fixed">
            <TableCaption className="sr-only">
              Documents in this folder. Drag a row to reorder it or move it to
              another folder.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <span className="sr-only">Reorder</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden w-[30%] md:table-cell">
                  Document ID
                </TableHead>
                <TableHead className="hidden w-[22%] lg:table-cell">
                  Size
                </TableHead>
                <TableHead className="hidden w-32 md:table-cell">
                  Added
                </TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => {
                const updating =
                  updateDocument.isPending &&
                  updateDocument.variables?.documentId === document.id;

                return (
                  <TableRow
                    key={document.id}
                    draggable={!actionsDisabled}
                    aria-busy={updating || undefined}
                    title="Drag to reorder or move to another folder"
                    onDragStart={(event) => startDragging(event, document.id)}
                    onDragEnd={stopDragging}
                    onDragOver={(event) => dragOver(event, document.id)}
                    onDrop={(event) => drop(event, document.id)}
                    className={cn(
                      'group/row',
                      actionsDisabled
                        ? 'cursor-default'
                        : 'cursor-grab active:cursor-grabbing',
                      draggedDocumentId === document.id && 'opacity-50',
                      dropTarget?.documentId === document.id &&
                        dropTarget.edge === 'before' &&
                        'border-t-primary border-t-2',
                      dropTarget?.documentId === document.id &&
                        dropTarget.edge === 'after' &&
                        'border-b-primary border-b-2',
                    )}
                  >
                    <TableCell className="w-8 px-2 py-2">
                      <span className="flex items-center" aria-hidden="true">
                        <ReorderDotsIcon />
                      </span>
                    </TableCell>
                    <TableCell className="min-w-0 py-2 whitespace-normal">
                      <div className="flex min-w-0 items-center gap-2 px-1 py-0.5">
                        <span
                          title={
                            document.filename ??
                            `${document.name}.${document.extension}`
                          }
                          className="min-w-0 truncate text-sm"
                        >
                          {document.filename ??
                            `${document.name}.${document.extension}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden min-w-0 py-2 md:table-cell">
                      <button
                        type="button"
                        title="Copy Document ID"
                        aria-label={`Copy document ID ${document.id}`}
                        onClick={() => copyDocumentId(document.id)}
                        className="group/id text-muted-foreground hover:bg-muted hover:text-foreground inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 font-mono text-xs"
                      >
                        <span className="truncate">{document.id}</span>
                        {copiedDocumentId === document.id ? (
                          <Check className="text-success size-3.5 shrink-0" />
                        ) : (
                          <Copy className="size-3.5 shrink-0 opacity-60 group-hover/id:opacity-100" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden py-2 text-sm tabular-nums lg:table-cell">
                      {formatFileSize(document.sizeBytes)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden py-2 text-sm whitespace-nowrap md:table-cell">
                      <span
                        suppressHydrationWarning
                        title={formatFullDate(document.createdAt)}
                      >
                        {formatDate(document.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="w-12 py-2 text-right">
                      <DocumentActionsMenu
                        document={document}
                        disabled={actionsDisabled || updateDocument.isPending}
                        loading={updating}
                        onDelete={() => setDocumentToDeleteId(document.id)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <DeleteDocumentDialog
        document={documentToDelete}
        isDeleting={deleteDocument.isPending}
        onClose={() => setDocumentToDeleteId(undefined)}
        onConfirm={remove}
      />
    </>
  );
}
