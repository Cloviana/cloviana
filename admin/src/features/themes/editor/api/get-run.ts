import 'server-only';

import { api } from '@/lib/api/api-client';

import type { AgentRun } from '../types';

export function getRun(slug: string, runId: string) {
  return api.get<AgentRun>(
    `/marketplaces/${encodeURIComponent(slug)}/assistant/runs/${encodeURIComponent(runId)}`,
  );
}
