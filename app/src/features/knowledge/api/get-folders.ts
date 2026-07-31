import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { folderKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Folder } from '@/types/api';

export const getFolders = async (businessId: string): Promise<Folder[]> => {
  const headers = await getAuthHeaders();

  return api.get<Folder[]>(`/businesses/${businessId}/folders`, {
    headers,
  });
};

export const getFoldersQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: folderKeys.list(businessId),
    queryFn: () => getFolders(businessId),
    enabled: Boolean(businessId),
  });

type UseGetFoldersOptions = {
  queryConfig?: QueryConfig<typeof getFoldersQueryOptions>;
};

export const useGetFolders = (
  businessId: string,
  { queryConfig }: UseGetFoldersOptions = {},
) =>
  useQuery({
    ...getFoldersQueryOptions(businessId),
    ...queryConfig,
  });
