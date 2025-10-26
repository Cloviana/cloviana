import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { AccessStage } from '@/types/api';

export type BetaAcceptResponse = {
  storeId: string;
  stage: AccessStage;
  acceptedAt: string;
  betaUntil: string;
};

export const acceptInvite = async (
  inviteToken: string,
): Promise<BetaAcceptResponse> => {
  const accessToken = await fetchAccessToken();
  if (!accessToken) throw new Error('Access token is not available');

  return api.post<BetaAcceptResponse>(
    `/beta/accept`,
    { token: inviteToken },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
};

type UseAcceptInviteOptions = {
  config?: MutationConfig<typeof acceptInvite>;
};

export const useAcceptInvite = ({ config }: UseAcceptInviteOptions = {}) => {
  return useMutation({
    mutationKey: ['beta', 'accept'],
    mutationFn: (inviteToken: string) => acceptInvite(inviteToken),
    ...config,
  });
};
