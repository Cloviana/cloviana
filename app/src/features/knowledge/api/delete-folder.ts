import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import { revalidateKnowledge } from './revalidate-knowledge';

export type DeleteFolderInput = {
  businessId: string;
  folderId: string;
};

// Rejects with 409 for the default folder, a non-empty folder, or one whose
// documents are still being deleted — surface the server message verbatim.
export const deleteFolder = async ({
  businessId,
  folderId,
}: DeleteFolderInput): Promise<void> => {
  const headers = await getAuthHeaders();

  return api.delete(`/businesses/${businessId}/folders/${folderId}`, {
    headers,
  });
};

type UseDeleteFolderOptions = {
  mutationConfig?: MutationConfig<typeof deleteFolder>;
};

export const useDeleteFolder = ({
  mutationConfig,
}: UseDeleteFolderOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFolder,
    ...mutationConfig,
    onSuccess: (...args) => {
      void revalidateKnowledge(queryClient, args[1].businessId);
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
