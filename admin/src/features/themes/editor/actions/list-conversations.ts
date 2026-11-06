'use server';

import { listConversations } from '../api/list-conversations';

export async function listConversationsAction(slug: string, themeId: string) {
  return listConversations(slug, themeId);
}
