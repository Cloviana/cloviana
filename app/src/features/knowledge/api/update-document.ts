import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { documentKeys, folderKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Document, Folder } from '@/types/api';

import { revalidateKnowledge } from './revalidate-knowledge';

export type UpdateDocumentInput = {
  businessId: string;
  documentId: string;
  name?: string;
  folderId?: string;
  position?: number;
};

// Returns 409 when the document is still PROCESSING — it cannot change folders
// mid-ingestion.
export const updateDocument = async ({
  businessId,
  documentId,
  name,
  folderId,
  position,
}: UpdateDocumentInput): Promise<Document> => {
  const headers = await getAuthHeaders();

  return api.patch<Document>(
    `/businesses/${businessId}/documents/${documentId}`,
    {
      ...(name === undefined ? {} : { name }),
      ...(folderId === undefined ? {} : { folderId }),
      ...(position === undefined ? {} : { position }),
    },
    { headers },
  );
};

const byPosition = (a: Document, b: Document) =>
  a.position - b.position ||
  b.createdAt.localeCompare(a.createdAt) ||
  b.id.localeCompare(a.id);

const renumber = (documents: Document[]) =>
  documents.map((document, position) =>
    document.position === position ? document : { ...document, position },
  );

type ReorderInput = {
  documentId: string;
  folderId?: string;
  position?: number;
  folder?: Document['folder'];
};

/**
 * Mirrors the server's reorder: the moved document lands at `position` in the
 * target folder and every sibling in both the source and target folder is
 * renumbered. Pure so a drag can be previewed before the request resolves.
 */
function reorderDocuments(
  documents: Document[],
  { documentId, folderId, position, folder }: ReorderInput,
): Document[] {
  const moving = documents.find((document) => document.id === documentId);
  if (!moving) return documents;

  const targetFolderId = folderId ?? moving.folderId;
  const folderChanged = targetFolderId !== moving.folderId;
  const rest = documents.filter((document) => document.id !== documentId);

  const target = rest
    .filter((document) => document.folderId === targetFolderId)
    .sort(byPosition);
  const targetPosition = Math.min(
    position ?? (folderChanged ? target.length : moving.position),
    target.length,
  );
  target.splice(targetPosition, 0, {
    ...moving,
    folderId: targetFolderId,
    folder: folder ?? moving.folder,
  });

  const source = folderChanged
    ? renumber(
        rest
          .filter((document) => document.folderId === moving.folderId)
          .sort(byPosition),
      )
    : [];
  const untouched = rest.filter(
    (document) =>
      document.folderId !== targetFolderId &&
      document.folderId !== moving.folderId,
  );

  // Keep the cache in the same order a fresh fetch would return.
  return [...untouched, ...source, ...renumber(target)].sort(
    (a, b) => a.folderId.localeCompare(b.folderId) || byPosition(a, b),
  );
}

type UpdateDocumentContext = {
  previousDocuments?: Document[];
};

type UseUpdateDocumentOptions = {
  mutationConfig?: Omit<
    UseMutationOptions<
      Document,
      Error,
      UpdateDocumentInput,
      UpdateDocumentContext
    >,
    'mutationFn' | 'onMutate'
  >;
};

export const useUpdateDocument = ({
  mutationConfig,
}: UseUpdateDocumentOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDocument,
    ...mutationConfig,
    // Owned by this hook — a drag has to preview instantly to feel right.
    onMutate: async (variables): Promise<UpdateDocumentContext> => {
      const documentsKey = documentKeys.lists(variables.businessId);
      await queryClient.cancelQueries({ queryKey: documentsKey, exact: true });

      const previousDocuments =
        queryClient.getQueryData<Document[]>(documentsKey);
      if (!previousDocuments) return {};

      // A rename touches no ordering, so skip the reorder entirely.
      if (
        variables.folderId === undefined &&
        variables.position === undefined
      ) {
        if (variables.name !== undefined) {
          queryClient.setQueryData<Document[]>(documentsKey, (documents) =>
            documents?.map((item) =>
              item.id === variables.documentId
                ? { ...item, name: variables.name as string }
                : item,
            ),
          );
        }
        return { previousDocuments };
      }

      const targetFolder = queryClient
        .getQueryData<Folder[]>(folderKeys.list(variables.businessId))
        ?.find((folder) => folder.id === variables.folderId);

      queryClient.setQueryData<Document[]>(
        documentsKey,
        reorderDocuments(previousDocuments, {
          documentId: variables.documentId,
          folderId: variables.folderId,
          position: variables.position,
          folder: targetFolder && {
            id: targetFolder.id,
            name: targetFolder.name,
            parentId: targetFolder.parentId,
          },
        }),
      );

      return { previousDocuments };
    },
    onError: (...args) => {
      const [, variables, context] = args;
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          documentKeys.lists(variables.businessId),
          context.previousDocuments,
        );
      }
      mutationConfig?.onError?.(...args);
    },
    onSettled: (...args) => {
      const variables = args[2];
      void revalidateKnowledge(queryClient, variables.businessId);
      mutationConfig?.onSettled?.(...args);
    },
  });
};
