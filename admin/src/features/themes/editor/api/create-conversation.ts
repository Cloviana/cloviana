import 'server-only';

import { api } from '@/lib/api/api-client';

import type { Conversation } from '../types';

export function createConversation(slug: string, title: string) {
  return api.post<Conversation>(
    `/marketplaces/${encodeURIComponent(slug)}/assistant/conversations`,
    {
      title,
    },
  );
}
