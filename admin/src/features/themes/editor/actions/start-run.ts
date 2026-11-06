'use server';

import { themeActionError } from '../../lib/action-error';
import type { ThemeActionResult } from '../../types/theme';
import { createConversation } from '../api/create-conversation';
import { startRun } from '../api/start-run';
import type { RunContext } from '../chat/model/run-context';
import type { AgentMode, AgentRun } from '../types';

const TITLE_LENGTH = 80;

export async function startRunAction(
  slug: string,
  themeId: string,
  input: {
    conversationId: string | null;
    prompt: string;
    idempotencyKey: string;
    mode: AgentMode;
    context?: RunContext;
    attachmentIds?: string[];
  },
): Promise<ThemeActionResult<{ run: AgentRun }>> {
  try {
    const conversationId =
      input.conversationId ??
      (await createConversation(slug, input.prompt.slice(0, TITLE_LENGTH))).id;
    const run = await startRun(slug, conversationId, {
      prompt: input.prompt,
      idempotencyKey: input.idempotencyKey,
      themeId,
      mode: input.mode,
      context: input.context,
      attachmentIds: input.attachmentIds,
    });
    return { success: true, run };
  } catch (error) {
    return themeActionError(error, "Couldn't send your message.");
  }
}
