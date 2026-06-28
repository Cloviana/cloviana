import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { documentKeys, MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { Document, DocumentTag } from '@/types/api';

type UpdateDocumentInput = {
  businessId: string;
  documentId: string;
  tag: DocumentTag;
};

export const updateDocument = async ({
  businessId,
  documentId,
  tag,
}: UpdateDocumentInput): Promise<Document> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.patch<Document>(
    `/businesses/${businessId}/documents/${documentId}`,
    { tag },
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

type UseUpdateDocumentOptions = {
  mutationConfig?: MutationConfig<typeof updateDocument>;
};

export const useUpdateDocument = ({
  mutationConfig,
}: UseUpdateDocumentOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDocument,
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.list(businessId),
      });
    },
    ...mutationConfig,
  });
};
