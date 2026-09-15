import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import { revalidateKnowledge } from './revalidate-knowledge';

export type DeleteDocumentInput = {
  businessId: string;
  documentId: string;
};

// Soft-deletes immediately; purging the vectors happens in the background.
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
      void revalidateKnowledge(queryClient, args[1].businessId);
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
