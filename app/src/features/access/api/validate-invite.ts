import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { AccessStage } from '@/types/api';

export type BetaValidationResponse = {
  token: string;
  storeId: string;
  storeStage: AccessStage;
  accepted: boolean;
  expired: boolean;
  expiresAt: string;
};

export const validateInvite = async (
  inviteToken: string,
): Promise<BetaValidationResponse> => {
  const accessToken = await fetchAccessToken();
  if (!accessToken) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<BetaValidationResponse>(`/beta/validate`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { token: inviteToken },
  });
  return response;
};

export const validateInviteQueryOptions = (inviteToken: string) =>
  queryOptions({
    queryKey: ['beta', 'validate', inviteToken],
    queryFn: () => validateInvite(inviteToken),
    enabled: Boolean(inviteToken),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });

type UseValidateInviteOptions = {
  config?: QueryConfig<typeof validateInviteQueryOptions>;
};

export const useValidateInvite = (
  inviteToken: string,
  { config }: UseValidateInviteOptions = {},
) => {
  return useQuery({
    ...validateInviteQueryOptions(inviteToken),
    ...config,
  });
};
