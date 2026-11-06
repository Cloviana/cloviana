'use server';

import { listMessages } from '../api/list-messages';

export async function listMessagesAction(slug: string, conversationId: string) {
  return listMessages(slug, conversationId);
}
