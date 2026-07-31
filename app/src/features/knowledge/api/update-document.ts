import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { documentKeys, folderKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Document, Folder } from '@/types/api';

import {
  cacheUpdatedDocument,
  cancelKnowledgeQueries,
  findCachedDocument,
  type KnowledgeCacheSnapshot,
  revalidateKnowledgeCache,
  restoreKnowledgeCache,
  snapshotKnowledgeCache,
} from './knowledge-cache';

type UpdateDocumentInput = {
  businessId: string;
  documentId: string;
  folderId?: string;
  position?: number;
};

export const updateDocument = async ({
  businessId,
  documentId,
  folderId,
  position,
}: UpdateDocumentInput): Promise<Document> => {
  const headers = await getAuthHeaders();
  return api.patch<Document>(
    `/businesses/${businessId}/documents/${documentId}`,
    {
      ...(folderId === undefined ? {} : { folderId }),
      ...(position === undefined ? {} : { position }),
    },
    { headers },
  );
};

type UpdateDocumentContext = {
  snapshot: KnowledgeCacheSnapshot;
};

export const useUpdateDocument = (businessId: string) => {
  const queryClient = useQueryClient();
  const mutationKey = ['knowledge', 'structure', businessId] as const;
  const activeStructureMutations = useIsMutating({
    mutationKey,
    exact: true,
  });

  const mutation = useMutation<
    Document,
    Error,
    UpdateDocumentInput,
    UpdateDocumentContext
  >({
    mutationKey,
    scope: { id: `knowledge-structure:${businessId}` },
    mutationFn: updateDocument,
    onMutate: async (variables) => {
      await cancelKnowledgeQueries(queryClient, variables.businessId);

      const snapshot = snapshotKnowledgeCache(
        queryClient,
        variables.businessId,
      );
      const folders = queryClient.getQueryData<Folder[]>(
        folderKeys.list(variables.businessId),
      );
      const document = findCachedDocument(
        queryClient,
        variables.businessId,
        variables.documentId,
      );

      if (document) {
        const targetFolderId = variables.folderId ?? document.folderId;
        const targetFolder = folders?.find(
          (folder) => folder.id === targetFolderId,
        );
        const folderChanged = targetFolderId !== document.folderId;
        const targetDocuments = queryClient.getQueryData<Document[]>(
          documentKeys.list(variables.businessId, targetFolderId),
        );
        const position =
          variables.position ??
          (folderChanged ? (targetDocuments?.length ?? 0) : document.position);

        cacheUpdatedDocument(queryClient, variables.businessId, {
          ...document,
          folderId: targetFolderId,
          position,
          ...(targetFolder
            ? {
                folder: {
                  id: targetFolder.id,
                  name: targetFolder.name,
                  parentId: targetFolder.parentId,
                },
              }
            : {}),
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
      cacheUpdatedDocument(queryClient, variables.businessId, data);
    },
  });

  return {
    ...mutation,
    isPending: activeStructureMutations > 0,
  };
};
