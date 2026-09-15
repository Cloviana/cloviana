import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { promptKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { Prompt } from '../types';

export const getPrompt = async (
  businessId: string,
  promptId: string,
): Promise<Prompt> => {
  const headers = await getAuthHeaders();

  return api.get<Prompt>(`/businesses/${businessId}/prompts/${promptId}`, {
    headers,
  });
};

export const getPromptQueryOptions = (businessId: string, promptId: string) =>
  queryOptions({
    queryKey: promptKeys.detail(businessId, promptId),
    queryFn: () => getPrompt(businessId, promptId),
    enabled: Boolean(businessId) && Boolean(promptId),
  });
