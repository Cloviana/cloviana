'use server';

import { themeActionError } from '../../lib/action-error';
import type { ThemeActionResult } from '../../types/theme';
import { createConversation } from '../api/create-conversation';

/** Starts a conversation before the first message, which an attachment needs to belong to. */
export async function createConversationAction(
  slug: string,
): Promise<ThemeActionResult<{ id: string }>> {
  try {
    const { id } = await createConversation(slug, 'New conversation');
    return { success: true, id };
  } catch (error) {
    return themeActionError(error, "Couldn't start the conversation.");
  }
}
