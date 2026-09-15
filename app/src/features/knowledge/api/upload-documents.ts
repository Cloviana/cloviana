import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Document } from '@/types/api';

import { revalidateKnowledge } from './revalidate-knowledge';

export type UploadDocumentsInput = {
  businessId: string;
  folderId?: string;
  files: File[];
};

// Documents come back PENDING; ingestion happens in the background and the
// documents query polls until every one of them lands on READY.
export const uploadDocuments = async ({
  businessId,
  folderId,
  files,
}: UploadDocumentsInput): Promise<Document[]> => {
  const headers = await getAuthHeaders();

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
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
      void revalidateKnowledge(queryClient, args[1].businessId);
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
