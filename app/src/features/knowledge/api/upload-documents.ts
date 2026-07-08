import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { documentKeys, MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { Document, DocumentTag } from '@/types/api';

type UploadDocumentsInput = {
  businessId: string;
  files: { file: File; tag: DocumentTag }[];
};

export const uploadDocuments = async ({
  businessId,
  files,
}: UploadDocumentsInput): Promise<Document[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  const formData = new FormData();
  files.forEach(({ file, tag }) => {
    formData.append('files', file);
    formData.append('tags', tag);
  });

  return api.post<Document[]>(`/businesses/${businessId}/documents`, formData, {
    headers: { Authorization: `Bearer ${token}` },
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
    // Runs after the spread so a caller's onSuccess composes with the cache
    // refresh instead of replacing it.
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.list(args[1].businessId),
      });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
