'use client';

import { ChevronRight, Folder as FolderIcon, Search } from 'lucide-react';
import { type DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { getKnowledgeError } from '@/features/knowledge/api/knowledge-error';
import { useUpdateDocument } from '@/features/knowledge/api/update-document';
import type { Document, Folder } from '@/types/api';
import { cn } from '@/utils/cn';

import { DOCUMENT_DRAG_TYPE } from './document-drag';

type FolderSidebarProps = {
  businessId: string;
  folders: Folder[];
  documents: Document[];
  selectedFolderId?: string;
  onSelectFolder: (folderId: string) => void;
  isLoading?: boolean;
};

type FolderRowProps = {
  folder: Folder;
  childrenByParent: Map<string | null, Folder[]>;
  selectedFolderId?: string;
  expanded: Set<string>;
  depth: number;
  onSelectFolder: (folderId: string) => void;
  onToggle: (folderId: string) => void;
  dropTargetFolderId?: string;
  onDocumentDragOver: (event: DragEvent<HTMLElement>, folderId: string) => void;
  onDocumentDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDocumentDrop: (event: DragEvent<HTMLElement>, folder: Folder) => void;
};

function FolderRow({
  folder,
  childrenByParent,
  selectedFolderId,
  expanded,
  depth,
  onSelectFolder,
  onToggle,
  dropTargetFolderId,
  onDocumentDragOver,
  onDocumentDragLeave,
  onDocumentDrop,
}: FolderRowProps) {
  const children = childrenByParent.get(folder.id) ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(folder.id);
  const isSelected = folder.id === selectedFolderId;

  return (
    <div>
      <div
        onDragOver={(event) => onDocumentDragOver(event, folder.id)}
        onDragLeave={onDocumentDragLeave}
        onDrop={(event) => onDocumentDrop(event, folder)}
        className={cn(
          'group flex w-full items-center rounded-md pr-2 transition-colors',
          isSelected ? 'bg-muted text-foreground' : 'hover:bg-muted/60',
          dropTargetFolderId === folder.id &&
            'ring-primary bg-muted ring-2 ring-inset',
        )}
        style={{ paddingLeft: `${Math.min(depth, 8) * 14}px` }}
      >
        <button
          type="button"
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${folder.name}`}
          onClick={() => hasChildren && onToggle(folder.id)}
          disabled={!hasChildren}
          className="text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md disabled:cursor-default"
        >
          {hasChildren && (
            <ChevronRight
              className={cn(
                'size-3.5 transition-transform',
                isExpanded && 'rotate-90',
              )}
            />
          )}
        </button>

        <button
          type="button"
          aria-current={isSelected ? 'page' : undefined}
          onClick={() => onSelectFolder(folder.id)}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
        >
          <FolderIcon className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {folder.name}
          </span>
          <span className="text-muted-foreground hidden shrink-0 text-[11px] tabular-nums sm:inline">
            {folder._count.documents}{' '}
            {folder._count.documents === 1 ? 'doc' : 'docs'}
          </span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="relative">
          <span
            aria-hidden
            className="bg-border pointer-events-none absolute inset-y-0 w-px"
            style={{ left: `${Math.min(depth, 8) * 14 + 16}px` }}
          />
          {children.map((child) => (
            <FolderRow
              key={child.id}
              folder={child}
              childrenByParent={childrenByParent}
              selectedFolderId={selectedFolderId}
              expanded={expanded}
              depth={depth + 1}
              onSelectFolder={onSelectFolder}
              onToggle={onToggle}
              dropTargetFolderId={dropTargetFolderId}
              onDocumentDragOver={onDocumentDragOver}
              onDocumentDragLeave={onDocumentDragLeave}
              onDocumentDrop={onDocumentDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderSidebar({
  businessId,
  folders,
  documents,
  selectedFolderId,
  onSelectFolder,
  isLoading = false,
}: FolderSidebarProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string>();
  const knownParentFolderIds = useRef<Set<string>>(new Set());
  const updateDocument = useUpdateDocument(businessId);

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, Folder[]>();
    for (const folder of folders) {
      const siblings = map.get(folder.parentId) ?? [];
      siblings.push(folder);
      map.set(folder.parentId, siblings);
    }
    for (const siblings of map.values()) {
      siblings.sort(
        (a, b) => a.position - b.position || a.name.localeCompare(b.name),
      );
    }
    return map;
  }, [folders]);

  useEffect(() => {
    const parentFolderIds = new Set(
      folders
        .filter((folder) => folder._count.children > 0)
        .map((folder) => folder.id),
    );
    const newlyPopulatedFolderIds = [...parentFolderIds].filter(
      (folderId) => !knownParentFolderIds.current.has(folderId),
    );
    knownParentFolderIds.current = parentFolderIds;

    if (newlyPopulatedFolderIds.length === 0) return;
    setExpanded((current) => {
      const next = new Set(current);
      for (const folderId of newlyPopulatedFolderIds) {
        next.add(folderId);
      }
      return next;
    });
  }, [folders]);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const searchResults = normalizedSearch
    ? folders.filter((folder) =>
        folder.name.toLocaleLowerCase().includes(normalizedSearch),
      )
    : [];

  function toggle(folderId: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  function documentDragOver(event: DragEvent<HTMLElement>, folderId: string) {
    if (
      updateDocument.isPending ||
      folderId === selectedFolderId ||
      !event.dataTransfer.types.includes(DOCUMENT_DRAG_TYPE)
    ) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetFolderId(folderId);
  }

  function documentDragLeave(event: DragEvent<HTMLElement>) {
    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
      return;
    }
    setDropTargetFolderId(undefined);
  }

  function documentDrop(event: DragEvent<HTMLElement>, folder: Folder) {
    event.preventDefault();
    const documentId = event.dataTransfer.getData(DOCUMENT_DRAG_TYPE);
    setDropTargetFolderId(undefined);
    if (
      !documentId ||
      updateDocument.isPending ||
      folder.id === selectedFolderId
    ) {
      return;
    }
    const document = documents.find((item) => item.id === documentId);
    if (!document) return;
    if (document.status === 'PROCESSING') {
      toast.error('Wait for ingestion to finish before moving this document');
      return;
    }

    updateDocument.mutate(
      { businessId, documentId, folderId: folder.id },
      {
        onSuccess: () => toast.success(`Moved to ${folder.name}`),
        onError: (error) =>
          toast.error(getKnowledgeError(error, 'Could not move document')),
      },
    );
  }

  return (
    <aside
      aria-label="Knowledge folders"
      className="border-border flex max-h-72 min-h-0 flex-col border-b md:max-h-none md:w-80 md:shrink-0 md:border-r md:border-b-0"
    >
      <div className="border-border border-b p-3">
        <InputGroup>
          <InputGroupAddon className="pl-2">
            <Search className="size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search folders"
            placeholder="Search folders…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-9 w-full" />
            ))}
          </div>
        ) : normalizedSearch ? (
          searchResults.length > 0 ? (
            searchResults.map((folder) => (
              <button
                key={folder.id}
                type="button"
                aria-current={
                  folder.id === selectedFolderId ? 'page' : undefined
                }
                onClick={() => onSelectFolder(folder.id)}
                onDragOver={(event) => documentDragOver(event, folder.id)}
                onDragLeave={documentDragLeave}
                onDrop={(event) => documentDrop(event, folder)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                  folder.id === selectedFolderId
                    ? 'bg-muted font-medium'
                    : 'hover:bg-muted/60',
                  dropTargetFolderId === folder.id &&
                    'ring-primary bg-muted ring-2 ring-inset',
                )}
              >
                <FolderIcon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                <span className="text-muted-foreground text-[11px] tabular-nums">
                  {folder._count.documents}
                </span>
              </button>
            ))
          ) : (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              No folders found
            </p>
          )
        ) : (
          (childrenByParent.get(null) ?? []).map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              childrenByParent={childrenByParent}
              selectedFolderId={selectedFolderId}
              expanded={expanded}
              depth={0}
              onSelectFolder={onSelectFolder}
              onToggle={toggle}
              dropTargetFolderId={dropTargetFolderId}
              onDocumentDragOver={documentDragOver}
              onDocumentDragLeave={documentDragLeave}
              onDocumentDrop={documentDrop}
            />
          ))
        )}
      </div>
    </aside>
  );
}
