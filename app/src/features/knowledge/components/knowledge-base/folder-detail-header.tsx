'use client';

import { Check, Copy, X } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getKnowledgeError } from '@/features/knowledge/api/knowledge-error';
import { useUpdateFolder } from '@/features/knowledge/api/update-folder';
import type { Folder } from '@/types/api';

import { FolderActions } from './folder-actions';

type FolderDetailHeaderProps = {
  businessId: string;
  folder: Folder;
  folders: Folder[];
  documentCount: number;
  onSelectFolder: (folderId: string) => void;
  onUpload: () => void;
  isUploading?: boolean;
  uploadDisabled?: boolean;
  actionsDisabled?: boolean;
  onDeleted: () => void;
};

export function FolderDetailHeader({
  businessId,
  folder,
  folders,
  documentCount,
  onSelectFolder,
  onUpload,
  isUploading = false,
  uploadDisabled = false,
  actionsDisabled = false,
  onDeleted,
}: FolderDetailHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string>();
  const [folderName, setFolderName] = useState('');
  const updateFolder = useUpdateFolder(businessId);
  const isRenaming = renamingFolderId === folder.id;
  const breadcrumbs = useMemo(() => {
    const byId = new Map(folders.map((item) => [item.id, item]));
    const path: Folder[] = [folder];
    const visited = new Set([folder.id]);
    let parentId = folder.parentId;

    while (parentId && !visited.has(parentId)) {
      const parent = byId.get(parentId);
      if (!parent) break;
      path.unshift(parent);
      visited.add(parent.id);
      parentId = parent.parentId;
    }
    return path;
  }, [folder, folders]);

  async function copyFolderId() {
    try {
      await navigator.clipboard.writeText(folder.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_500);
    } catch {
      toast.error('Could not copy the folder ID');
    }
  }

  function startRenaming() {
    if (updateFolder.isPending) return;
    setFolderName(folder.name);
    setRenamingFolderId(folder.id);
  }

  function cancelRenaming() {
    setRenamingFolderId(undefined);
    setFolderName('');
  }

  function renameFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = folderName.trim().replace(/\s+/g, ' ');
    if (!name || updateFolder.isPending) return;
    if (name === folder.name) {
      cancelRenaming();
      return;
    }

    updateFolder.mutate(
      { businessId, folderId: folder.id, name },
      {
        onSuccess: () => toast.success('Folder renamed'),
        onError: (error) =>
          toast.error(getKnowledgeError(error, 'Could not rename folder')),
      },
    );
    cancelRenaming();
  }

  return (
    <div className="border-border border-b px-4 py-4 md:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          {isRenaming ? (
            <form
              onSubmit={renameFolder}
              className="flex max-w-lg items-center gap-1"
            >
              <Input
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelRenaming();
                  }
                }}
                maxLength={100}
                autoFocus
                disabled={updateFolder.isPending}
                aria-label="Folder name"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                disabled={updateFolder.isPending || !folderName.trim()}
                aria-label={
                  updateFolder.isPending
                    ? 'Saving folder name'
                    : 'Save folder name'
                }
              >
                {updateFolder.isPending ? (
                  <Spinner variant="1" className="size-4" />
                ) : (
                  <Check />
                )}
              </Button>
              {updateFolder.isPending ? (
                <span className="size-7 shrink-0" aria-hidden="true" />
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={cancelRenaming}
                  aria-label="Cancel rename"
                >
                  <X />
                </Button>
              )}
            </form>
          ) : (
            <nav aria-label="Breadcrumb">
              <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm wrap-break-word">
                {breadcrumbs.map((item, index) => {
                  const current = index === breadcrumbs.length - 1;
                  return (
                    <li
                      key={item.id}
                      className="inline-flex items-center gap-1.5"
                    >
                      {index > 0 && <span aria-hidden>/</span>}
                      {current ? (
                        <span
                          aria-current="page"
                          className="text-foreground font-medium"
                        >
                          {item.name}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectFolder(item.id)}
                          className="hover:text-foreground transition-colors"
                        >
                          {item.name}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}

          <button
            type="button"
            title="Copy folder ID"
            aria-label={`Copy folder ID ${folder.id}`}
            onClick={copyFolderId}
            className="group/id text-muted-foreground hover:bg-muted hover:text-foreground inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md py-0.5 font-mono text-xs"
          >
            <span className="truncate">{folder.id}</span>
            {copied ? (
              <Check className="text-success size-3.5 shrink-0" />
            ) : (
              <Copy className="size-3.5 shrink-0 opacity-60 group-hover/id:opacity-100" />
            )}
          </button>

          <p className="text-muted-foreground text-sm">
            {documentCount} {documentCount === 1 ? 'document' : 'documents'}
          </p>
        </div>

        <FolderActions
          businessId={businessId}
          folder={folder}
          onUpload={onUpload}
          onRename={startRenaming}
          isUploading={isUploading}
          uploadDisabled={uploadDisabled}
          actionsDisabled={
            actionsDisabled || isRenaming || updateFolder.isPending
          }
          onDeleted={onDeleted}
        />
      </div>
    </div>
  );
}
