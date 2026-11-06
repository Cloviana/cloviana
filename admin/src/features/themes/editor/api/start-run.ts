import 'server-only';

import { api } from '@/lib/api/api-client';

import type { RunContext } from '../chat/model/run-context';
import type { AgentMode, AgentRun } from '../types';

export function startRun(
  slug: string,
  conversationId: string,
  input: {
    prompt: string;
    idempotencyKey: string;
    themeId: string;
    mode: AgentMode;
    context?: RunContext;
  },
) {
  return api.post<AgentRun>(
    `/marketplaces/${encodeURIComponent(slug)}/assistant/conversations/${encodeURIComponent(conversationId)}/runs`,
    input,
  );
}
