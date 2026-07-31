import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import { cacheDeletedDocument } from './knowledge-cache';

type DeleteDocumentInput = {
  businessId: string;
  documentId: string;
};

export const deleteDocument = async ({
  businessId,
  documentId,
}: DeleteDocumentInput): Promise<void> => {
  const headers = await getAuthHeaders();
  return api.delete(`/businesses/${businessId}/documents/${documentId}`, {
    headers,
  });
};

type UseDeleteDocumentOptions = {
  mutationConfig?: MutationConfig<typeof deleteDocument>;
};

export const useDeleteDocument = ({
  mutationConfig,
}: UseDeleteDocumentOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    ...mutationConfig,
    onSuccess: (...args) => {
      cacheDeletedDocument(queryClient, args[1].businessId, args[1].documentId);
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
