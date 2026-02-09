import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { autopilotKeys, QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { AutopilotSettings } from '@/types/api';

export const getAutopilot = async (
  storeId: string,
): Promise<AutopilotSettings> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  return api.get<AutopilotSettings>(`/stores/${storeId}/autopilot`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getAutopilotQueryOptions = (storeId: string) =>
  queryOptions({
    queryKey: autopilotKeys.settings(storeId),
    queryFn: () => getAutopilot(storeId),
    enabled: Boolean(storeId),
  });

type UseGetAutopilotOptions = {
  storeId: string;
  queryConfig?: QueryConfig<typeof getAutopilotQueryOptions>;
};

export const useGetAutopilot = ({
  storeId,
  queryConfig,
}: UseGetAutopilotOptions) => {
  return useQuery({
    ...getAutopilotQueryOptions(storeId),
    ...queryConfig,
  });
};
