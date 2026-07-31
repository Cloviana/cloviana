import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { folderKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Folder } from '@/types/api';

import {
  cacheUpdatedFolder,
  cancelKnowledgeQueries,
  type KnowledgeCacheSnapshot,
  revalidateKnowledgeCache,
  restoreKnowledgeCache,
  snapshotKnowledgeCache,
} from './knowledge-cache';

type FolderMutationResult = Omit<Folder, '_count'>;

export type UpdateFolderInput = {
  businessId: string;
  folderId: string;
  name?: string;
  parentId?: string | null;
  position?: number;
};

export const updateFolder = async ({
  businessId,
  folderId,
  ...update
}: UpdateFolderInput): Promise<FolderMutationResult> => {
  const headers = await getAuthHeaders();

  return api.patch<FolderMutationResult>(
    `/businesses/${businessId}/folders/${folderId}`,
    update,
    { headers },
  );
};

type UpdateFolderContext = {
  snapshot: KnowledgeCacheSnapshot;
};

export const useUpdateFolder = (businessId: string) => {
  const queryClient = useQueryClient();
  const mutationKey = ['knowledge', 'structure', businessId] as const;
  const activeStructureMutations = useIsMutating({
    mutationKey,
    exact: true,
  });

  const mutation = useMutation<
    FolderMutationResult,
    Error,
    UpdateFolderInput,
    UpdateFolderContext
  >({
    mutationKey,
    scope: { id: `knowledge-structure:${businessId}` },
    mutationFn: updateFolder,
    onMutate: async (variables) => {
      await cancelKnowledgeQueries(queryClient, variables.businessId);

      const snapshot = snapshotKnowledgeCache(
        queryClient,
        variables.businessId,
      );
      const folders = queryClient.getQueryData<Folder[]>(
        folderKeys.list(variables.businessId),
      );
      const folder = folders?.find((item) => item.id === variables.folderId);

      if (folder) {
        cacheUpdatedFolder(queryClient, variables.businessId, {
          ...folder,
          name: variables.name ?? folder.name,
          parentId:
            variables.parentId === undefined
              ? folder.parentId
              : variables.parentId,
          position: variables.position ?? folder.position,
        });
      }

      return { snapshot };
    },
    onError: (_error, variables, context) => {
      if (context) {
        restoreKnowledgeCache(
          queryClient,
          variables.businessId,
          context.snapshot,
        );
        void revalidateKnowledgeCache(queryClient, variables.businessId);
      }
    },
    onSuccess: (data, variables) => {
      cacheUpdatedFolder(queryClient, variables.businessId, data);
    },
  });

  return {
    ...mutation,
    isPending: activeStructureMutations > 0,
  };
};
