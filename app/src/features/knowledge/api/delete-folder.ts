import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import { cacheDeletedFolder } from './knowledge-cache';

type DeleteFolderInput = {
  businessId: string;
  folderId: string;
};

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
      cacheDeletedFolder(queryClient, args[1].businessId, args[1].folderId);
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
