import type { AgentMessage } from '../../types';

import { userTextOf } from './thread-text';

/**
 * Up and Down in an empty message box walk back through what you sent earlier, like a shell.
 * `cursor` counts back from the newest: null means you are not recalling anything.
 */
export interface Recall {
  cursor: number | null;
  /** What the message box should now hold. */
  text: string;
}

export function recall(
  prompts: readonly string[],
  cursor: number | null,
  direction: 'older' | 'newer',
): Recall {
  if (direction === 'older') {
    const next = cursor === null ? 0 : Math.min(cursor + 1, prompts.length - 1);
    return prompts.length
      ? { cursor: next, text: prompts[prompts.length - 1 - next] }
      : { cursor: null, text: '' };
  }
  if (cursor === null || cursor === 0) return { cursor: null, text: '' };
  const next = cursor - 1;
  return { cursor: next, text: prompts[prompts.length - 1 - next] };
}

/** Consecutive repeats are recalled once. */
export function promptsFrom(
  messages: ReadonlyArray<{ role: string; text: string }>,
) {
  const prompts: string[] = [];
  for (const message of messages) {
    if (
      message.role === 'user' &&
      message.text &&
      prompts.at(-1) !== message.text
    ) {
      prompts.push(message.text);
    }
  }
  return prompts;
}

/** What the user sent in a saved conversation, oldest first. */
export function userPromptsOf(messages: readonly AgentMessage[]) {
  return promptsFrom(
    messages.map((message) => ({
      role: message.role === 'USER' ? 'user' : 'other',
      text: userTextOf(message.content),
    })),
  );
}
