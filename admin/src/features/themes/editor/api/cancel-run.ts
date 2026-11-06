import 'server-only';

import { api } from '@/lib/api/api-client';

import type { AgentRun } from '../types';

export function cancelRun(slug: string, runId: string) {
  return api.post<AgentRun>(
    `/marketplaces/${encodeURIComponent(slug)}/assistant/runs/${encodeURIComponent(runId)}/cancel`,
    {},
  );
}
