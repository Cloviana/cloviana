import 'server-only';

import { api } from '@/lib/api/api-client';

import type { Conversation } from '../types';

export function listConversations(slug: string, themeId: string) {
  return api.get<Conversation[]>(
    `/marketplaces/${encodeURIComponent(slug)}/assistant/conversations`,
    {
      params: { themeId },
    },
  );
}
