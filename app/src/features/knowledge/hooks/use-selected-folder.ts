'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { paths } from '@/config/paths';

import { useGetFolders } from '../api/get-folders';

const FOLDER_SEARCH_PARAM = 'folder';

/**
 * The folder being viewed, held in the URL so it survives a refresh and can be
 * linked to. Defaults to the business's default folder — not `folders[0]`,
 * which is a nested folder once any exist, since the API orders by `parentId`
 * and Postgres sorts the root folders' NULL parent last.
 */
export function useSelectedFolder(businessId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const foldersQuery = useGetFolders(businessId);
  const folders = foldersQuery.data ?? [];
  const selectedFolderId = searchParams.get(FOLDER_SEARCH_PARAM);

  // Resolving on every render means a deleted folder needs no cleanup — the
  // selection just falls back on its own.
  const folder =
    folders.find((item) => item.id === selectedFolderId) ??
    folders.find((item) => item.isDefault) ??
    folders[0];

  const selectFolder = useCallback(
    (folderId: string) =>
      // replace, not push — switching folders shouldn't stack up history.
      router.replace(
        paths.business.knowledgeBase.getHref(businessId, {
          [FOLDER_SEARCH_PARAM]: folderId,
        }),
        { scroll: false },
      ),
    [businessId, router],
  );

  return { folder, folders, selectFolder, foldersQuery };
}
