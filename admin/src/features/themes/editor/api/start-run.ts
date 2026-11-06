import 'server-only';

import { api } from '@/lib/api/api-client';

import type { AgentRun } from '../types';

export function startRun(
  slug: string,
  conversationId: string,
  input: { prompt: string; idempotencyKey: string; themeId: string },
) {
  return api.post<AgentRun>(
    `/marketplaces/${encodeURIComponent(slug)}/assistant/conversations/${encodeURIComponent(conversationId)}/runs`,
    input,
  );
}
