import 'server-only';

import { api } from '@/lib/api/api-client';

import type { AgentRun } from '../types';

export function getActiveRun(slug: string, conversationId: string) {
  return api.get<{ run: AgentRun | null }>(
    `/marketplaces/${encodeURIComponent(slug)}/assistant/conversations/${encodeURIComponent(conversationId)}/runs/active`,
  );
}
