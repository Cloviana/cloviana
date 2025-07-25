import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { RankedGoogleSearchItem } from '@/types/api'; // or wherever you’ve defined it

import { getSuggestedSourcesKey } from '../keys';

export const getSuggestedSources = async (
  storeId: string,
  title: string,
): Promise<RankedGoogleSearchItem[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is missing');

  const response = await api.post<RankedGoogleSearchItem[]>(
    `/stores/${storeId}/blogs/sources-suggestions`,
    { title },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response;
};

export const getSuggestedSourcesQueryOptions = (
  storeId: string,
  title: string,
) => ({
  queryKey: getSuggestedSourcesKey(storeId, title),
  queryFn: () => getSuggestedSources(storeId, title),
  enabled: Boolean(storeId && title),
  staleTime: Infinity,
  cacheTime: Infinity,
  refetchOnWindowFocus: false,
});

export const useGetSuggestedSources = (storeId: string, title: string) => {
  return useQuery(getSuggestedSourcesQueryOptions(storeId, title));
};
