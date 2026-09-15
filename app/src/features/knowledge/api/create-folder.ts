import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { FolderMutationResult } from '../types';

import { revalidateKnowledge } from './revalidate-knowledge';

export type CreateFolderInput = {
  businessId: string;
  name: string;
  parentId?: string;
};

export const createFolder = async ({
  businessId,
  name,
  parentId,
}: CreateFolderInput): Promise<FolderMutationResult> => {
  const headers = await getAuthHeaders();

  return api.post<FolderMutationResult>(
    `/businesses/${businessId}/folders`,
    { name, parentId },
    { headers },
  );
};

type UseCreateFolderOptions = {
  mutationConfig?: MutationConfig<typeof createFolder>;
};

export const useCreateFolder = ({
  mutationConfig,
}: UseCreateFolderOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFolder,
    ...mutationConfig,
    onSuccess: (...args) => {
      void revalidateKnowledge(queryClient, args[1].businessId);
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
