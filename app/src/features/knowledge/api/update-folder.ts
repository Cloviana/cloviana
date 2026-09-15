import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { FolderMutationResult } from '../types';

import { revalidateKnowledge } from './revalidate-knowledge';

export type UpdateFolderInput = {
  businessId: string;
  folderId: string;
  name?: string;
  parentId?: string | null;
  position?: number;
};

export const updateFolder = async ({
  businessId,
  folderId,
  ...update
}: UpdateFolderInput): Promise<FolderMutationResult> => {
  const headers = await getAuthHeaders();

  return api.patch<FolderMutationResult>(
    `/businesses/${businessId}/folders/${folderId}`,
    update,
    { headers },
  );
};

type UseUpdateFolderOptions = {
  mutationConfig?: MutationConfig<typeof updateFolder>;
};

export const useUpdateFolder = ({
  mutationConfig,
}: UseUpdateFolderOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFolder,
    ...mutationConfig,
    onSuccess: (...args) => {
      // Documents embed their folder's name, so a rename invalidates them too.
      void revalidateKnowledge(queryClient, args[1].businessId);
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
