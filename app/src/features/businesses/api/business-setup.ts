import { queryOptions, useQuery } from '@tanstack/react-query';

import type {
  SetupBusinessCompetitorsData,
  SetupBusinessProfileData,
  SetupBusinessPromptsData,
  SetupBusinessTopicsData,
  StartBusinessSetupData,
} from '@/features/businesses/schemas/business-setup';
import type {
  BusinessCompetitorSuggestions,
  BusinessSetup,
} from '@/features/businesses/types';
import { api } from '@/lib/api-client';
import { businessKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Business } from '@/types/api';

export const startBusinessSetup = async (
  payload: StartBusinessSetupData,
): Promise<Business> => {
  const headers = await getAuthHeaders();
  return api.post<Business>('/businesses/setup/start', payload, { headers });
};

export const getBusinessSetup = async (
  businessId: string,
): Promise<BusinessSetup> => {
  const headers = await getAuthHeaders();
  return api.get<BusinessSetup>(`/businesses/${businessId}/setup`, { headers });
};

export const getBusinessSetupQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: businessKeys.setup(businessId),
    queryFn: () => getBusinessSetup(businessId),
    enabled: Boolean(businessId),
  });

export const getBusinessCompetitorSuggestions = async (
  businessId: string,
): Promise<BusinessCompetitorSuggestions> => {
  const headers = await getAuthHeaders();
  return api.get<BusinessCompetitorSuggestions>(
    `/businesses/${businessId}/setup/competitor-suggestions`,
    { headers },
  );
};

export const getBusinessCompetitorSuggestionsQueryOptions = (
  businessId: string,
) =>
  queryOptions({
    queryKey: businessKeys.competitorSuggestions(businessId),
    queryFn: () => getBusinessCompetitorSuggestions(businessId),
    enabled: Boolean(businessId),
  });

export const useGetBusinessSetup = (businessId: string) => {
  return useQuery(getBusinessSetupQueryOptions(businessId));
};

export const useGetBusinessCompetitorSuggestions = (businessId: string) => {
  return useQuery(getBusinessCompetitorSuggestionsQueryOptions(businessId));
};

export const updateBusinessSetupCompetitors = async (
  businessId: string,
  payload: SetupBusinessCompetitorsData,
): Promise<Business> => {
  const headers = await getAuthHeaders();
  return api.patch<Business>(
    `/businesses/${businessId}/setup/competitors`,
    payload,
    { headers },
  );
};

export const updateBusinessSetupProfile = async (
  businessId: string,
  payload: SetupBusinessProfileData,
): Promise<Business> => {
  const headers = await getAuthHeaders();
  return api.patch<Business>(
    `/businesses/${businessId}/setup/profile`,
    {
      ...payload,
      distributionChannels: payload.distributionChannels
        .split(',')
        .map((channel) => channel.trim())
        .filter(Boolean),
    },
    { headers },
  );
};

export const retryBusinessPromptResearch = async (businessId: string) => {
  const headers = await getAuthHeaders();
  return api.post<{ queued: boolean }>(
    `/businesses/${businessId}/setup/prompt-research`,
    undefined,
    { headers },
  );
};

export const retryBusinessBrandResearch = async (businessId: string) => {
  const headers = await getAuthHeaders();
  return api.post<{ queued: boolean }>(
    `/businesses/${businessId}/setup/brand-research`,
    undefined,
    { headers },
  );
};

export const updateBusinessSetupTopics = async (
  businessId: string,
  payload: SetupBusinessTopicsData,
): Promise<Business> => {
  const headers = await getAuthHeaders();
  return api.patch<Business>(
    `/businesses/${businessId}/setup/topics`,
    payload,
    { headers },
  );
};

export const completeBusinessSetup = async (
  businessId: string,
  payload: SetupBusinessPromptsData,
): Promise<Business> => {
  const headers = await getAuthHeaders();
  return api.post<Business>(
    `/businesses/${businessId}/setup/complete`,
    {
      prompts: payload.prompts
        .filter((prompt) => prompt.selected)
        .map(({ clusterId, text, stage }) => ({ clusterId, text, stage })),
    },
    {
      headers,
    },
  );
};
