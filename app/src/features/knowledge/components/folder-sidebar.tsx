'use client';

import {
  hotkeysCoreFeature,
  syncDataLoaderFeature,
  type ItemInstance,
} from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner';

import { Tree, TreeItem, TreeItemLabel } from '@/components/reui/tree';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

import { getKnowledgeError } from '../api/knowledge-error';
import { useUpdateDocument } from '../api/update-document';
import { useSelectedFolder } from '../hooks/use-selected-folder';
import { getDraggedDocumentId, isDocumentDrag } from '../utils/drag';

import { FolderClosedIcon, FolderOpenedIcon } from './file-type-icons';
import { FolderActions } from './folder-actions';

// headless-tree needs one root id, but a business has several root folders —
// this synthetic node holds them and is skipped when rendering.
const ROOT_ID = '__root__';
const INDENT = 16;
const SPRING_OPEN_DELAY_MS = 600;

type TreeFolder = {
  name: string;
  children: string[];
};

type FolderSidebarProps = {
  businessId: string;
};

export function FolderSidebar({ businessId }: FolderSidebarProps) {
  const { folder, folders, selectFolder, foldersQuery } =
    useSelectedFolder(businessId);
  const [dropTargetId, setDropTargetId] = useState<string>();
  const updateDocument = useUpdateDocument();
  const springTimer = useRef<{
    itemId: string;
    timeout: ReturnType<typeof setTimeout>;
  }>(undefined);

  useEffect(
    () => () => {
      const pending = springTimer.current;
      if (pending) clearTimeout(pending.timeout);
    },
    [],
  );

  const items = useMemo(() => {
    const record: Record<string, TreeFolder> = {
      [ROOT_ID]: { name: 'Folders', children: [] },
    };
    const sorted = [...folders].sort(
      (a, b) => a.position - b.position || a.name.localeCompare(b.name),
    );

    for (const item of sorted) {
      record[item.id] = { name: item.name, children: [] };
    }
    for (const item of sorted) {
      record[item.parentId ?? ROOT_ID]?.children.push(item.id);
    }

    return record;
  }, [folders]);

  const tree = useTree<TreeFolder>({
    // ponytail: expand everything up front so a deep link to a nested folder
    // is visible without syncing expansion to the URL. Revisit if a business
    // ever has enough folders that the rail needs scrolling.
    initialState: {
      expandedItems: Object.keys(items).filter(
        (id) => items[id].children.length > 0,
      ),
    },
    indent: INDENT,
    rootItemId: ROOT_ID,
    getItemName: (item) => item.getItemData()?.name ?? '',
    isItemFolder: (item) => (item.getItemData()?.children.length ?? 0) > 0,
    // Click and Enter both route through here; selection stays owned by the URL.
    onPrimaryAction: (item) => {
      if (item.getId() !== ROOT_ID) {
        void selectFolder(item.getId());
      }
    },
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId]?.children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  // Spring-loaded folders: hovering a collapsed folder mid-drag opens it, so a
  // document can be dropped into a subfolder without breaking the drag.
  const springOpen = (item: ItemInstance<TreeFolder>) => {
    if (springTimer.current?.itemId === item.getId()) return;

    cancelSpringOpen();
    if (!item.isFolder() || item.isExpanded()) return;

    springTimer.current = {
      itemId: item.getId(),
      timeout: setTimeout(() => item.expand(), SPRING_OPEN_DELAY_MS),
    };
  };

  const cancelSpringOpen = () => {
    if (springTimer.current) {
      clearTimeout(springTimer.current.timeout);
      springTimer.current = undefined;
    }
  };

  const handleDrop = (
    event: DragEvent<HTMLElement>,
    targetFolderId: string,
  ) => {
    event.preventDefault();
    setDropTargetId(undefined);
    cancelSpringOpen();
    const documentId = getDraggedDocumentId(event);
    if (!documentId) return;

    updateDocument.mutate(
      { businessId, documentId, folderId: targetFolderId },
      { onError: (error) => toast.error(getKnowledgeError(error)) },
    );
  };

  return (
    <aside className="bg-sidebar border-sidebar-border flex w-64 shrink-0 flex-col overflow-y-auto border-r p-2">
      {foldersQuery.isPending ? (
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-8 w-full" />
          ))}
        </div>
      ) : foldersQuery.isError && folders.length === 0 ? (
        <div className="flex flex-col items-start gap-2 p-2">
          <p className="text-sidebar-foreground text-sm">
            Could not load folders.
          </p>
          <Button
            size="sm"
            variant="outline"
            loading={foldersQuery.isFetching}
            onClick={() => foldersQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <Tree
          indent={INDENT}
          tree={tree}
          // Indent guide lines, drawn as a repeating gradient one per level.
          className="relative before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--sidebar-border)_calc(var(--tree-indent)-1px),var(--sidebar-border)_calc(var(--tree-indent)))]"
        >
          {tree.getItems().map((item) => {
            if (item.getId() === ROOT_ID) return null;

            const isActive = item.getId() === folder?.id;
            const isDropTarget = dropTargetId === item.getId();
            const itemFolder = folders.find(
              (candidate) => candidate.id === item.getId(),
            );

            return (
              // The menu is a sibling of the tree item, not a child: the item
              // renders as a <button> and buttons cannot nest.
              // flex, so the button still stretches full width — otherwise it
              // shrinks to its text and stops masking the indent guide lines.
              <div
                key={item.getId()}
                className="group/row relative flex flex-col"
              >
                <TreeItem
                  item={item}
                  onDragOver={(event) => {
                    if (!isDocumentDrag(event)) return;
                    event.preventDefault();
                    setDropTargetId(item.getId());
                    springOpen(item);
                  }}
                  onDragLeave={() => {
                    setDropTargetId(undefined);
                    cancelSpringOpen();
                  }}
                  onDrop={(event) => handleDrop(event, item.getId())}
                >
                  <TreeItemLabel
                    className={cn(
                      // `before:` masks the guide lines behind the row, which is
                      // what makes the lines read as connectors rather than a grid.
                      // pe-8 keeps a long name from running under the menu,
                      // which is positioned out of the label's flow.
                      'bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent before:bg-sidebar relative pe-8 before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10',
                      isActive &&
                        'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                      isDropTarget &&
                        'bg-sidebar-accent ring-sidebar-ring ring-2 ring-inset',
                    )}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      {item.isExpanded() && item.isFolder() ? (
                        <FolderOpenedIcon className="pointer-events-none" />
                      ) : (
                        <FolderClosedIcon className="pointer-events-none" />
                      )}
                      <span className="truncate">{item.getItemName()}</span>
                    </span>
                  </TreeItemLabel>
                </TreeItem>

                {itemFolder && (
                  <FolderActions
                    businessId={businessId}
                    folder={itemFolder}
                    // z-30 clears the tree item's own z-10 (and its focus:z-20)
                    // — the row's opaque background would otherwise cover this.
                    // Stays put while its menu is open so it can't vanish
                    // mid-interaction, and on focus so it's keyboard reachable.
                    className="absolute top-1/2 right-1 z-30 -translate-y-1/2 opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                  />
                )}
              </div>
            );
          })}
        </Tree>
      )}
    </aside>
  );
}
