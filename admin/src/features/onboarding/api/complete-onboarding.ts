import 'server-only';

import { api } from '@/lib/api/api-client';

export function completeOnboarding(input: { marketplaceName?: string }) {
  return api.post<{ onboardedAt: string }>('/onboarding/complete', input);
}
