import 'server-only';

import { api } from '@/lib/api/api-client';

import type { AgentMessage } from '../types';

const PAGE_SIZE = 200;

export async function listMessages(slug: string, conversationId: string) {
  const messages: AgentMessage[] = [];
  let after = '0';
  for (;;) {
    const page = await api.get<AgentMessage[]>(
      `/marketplaces/${encodeURIComponent(slug)}/assistant/conversations/${encodeURIComponent(conversationId)}/messages`,
      { params: { after } },
    );
    messages.push(...page);
    if (page.length < PAGE_SIZE) return messages;
    after = page[page.length - 1].sequence;
  }
}
