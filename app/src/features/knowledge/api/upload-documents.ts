import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { documentKeys, folderKeys, MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Document } from '@/types/api';

import { cacheUploadedDocuments } from './knowledge-cache';

type UploadDocumentsInput = {
  businessId: string;
  folderId?: string;
  files: File[];
};

export const uploadDocuments = async ({
  businessId,
  folderId,
  files,
}: UploadDocumentsInput): Promise<Document[]> => {
  const headers = await getAuthHeaders();

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  if (folderId) formData.append('folderId', folderId);

  return api.post<Document[]>(`/businesses/${businessId}/documents`, formData, {
    headers,
  });
};

type UseUploadDocumentsOptions = {
  mutationConfig?: MutationConfig<typeof uploadDocuments>;
};

export const useUploadDocuments = ({
  mutationConfig,
}: UseUploadDocumentsOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocuments,
    ...mutationConfig,
    onSuccess: (...args) => {
      const folderId = args[0][0]?.folderId ?? args[1].folderId;
      const hasDocumentCache =
        Boolean(folderId) &&
        queryClient.getQueryData(
          documentKeys.list(args[1].businessId, folderId ?? ''),
        ) !== undefined;
      cacheUploadedDocuments(queryClient, args[1].businessId, args[0]);
      if (!hasDocumentCache) {
        void Promise.all([
          queryClient.invalidateQueries({
            queryKey: folderId
              ? documentKeys.list(args[1].businessId, folderId)
              : documentKeys.lists(args[1].businessId),
            exact: Boolean(folderId),
          }),
          queryClient.invalidateQueries({
            queryKey: folderKeys.list(args[1].businessId),
            exact: true,
          }),
        ]);
      }
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
