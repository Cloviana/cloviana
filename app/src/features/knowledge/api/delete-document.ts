import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { documentKeys, MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

type DeleteDocumentInput = {
  businessId: string;
  documentId: string;
};

export const deleteDocument = async ({
  businessId,
  documentId,
}: DeleteDocumentInput): Promise<void> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.delete(`/businesses/${businessId}/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` },
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
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.list(businessId),
      });
    },
    ...mutationConfig,
  });
};
