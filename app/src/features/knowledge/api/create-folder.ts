import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { folderKeys, MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Folder } from '@/types/api';

import { cacheCreatedFolder } from './knowledge-cache';

type FolderMutationResult = Omit<Folder, '_count'>;

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
      const hasFolderCache =
        queryClient.getQueryData(folderKeys.list(args[1].businessId)) !==
        undefined;
      cacheCreatedFolder(queryClient, args[1].businessId, args[0]);
      if (!hasFolderCache) {
        void queryClient.invalidateQueries({
          queryKey: folderKeys.list(args[1].businessId),
          exact: true,
        });
      }
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
