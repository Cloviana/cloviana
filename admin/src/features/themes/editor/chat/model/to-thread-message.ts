import type { ThreadMessageLike } from '@assistant-ui/react';

import type { AgentMessage } from '../../types';
import type { AgentMode } from '../../types';

import { modeOfMessage } from './mode';
import { partsOfMessage, type Part } from './part';
import { userTextOf } from './thread-text';

/** What an assistant message carries for the transcript, beside the text the library sees. */
export interface TranscriptMetadata {
  parts: readonly Part[];
  /** Set for a message that came from a plan, so it can offer to build it. */
  mode?: AgentMode;
}

/** The written answer: the text parts, which is what Copy and similar actions use. */
export function answerOf(parts: readonly Part[]) {
  return parts
    .flatMap((part) => (part.type === 'text' ? [part.text] : []))
    .join('\n\n');
}

/**
 * An assistant message from its parts. The library gets the answer text; the transcript gets the
 * parts themselves, so every step can be shown rather than flattened into text.
 */
export function assistantMessage(
  id: string,
  parts: readonly Part[],
  options: { createdAt?: Date; running?: boolean; mode?: AgentMode } = {},
): ThreadMessageLike {
  const metadata: TranscriptMetadata = { parts, mode: options.mode };
  return {
    id,
    role: 'assistant',
    content: answerOf(parts),
    createdAt: options.createdAt,
    ...(options.running ? { status: { type: 'running' as const } } : {}),
    metadata: { custom: { ...metadata } },
  };
}

/** A saved conversation message as the chat library shows it. System and tool messages aren't shown. */
export function toThreadMessage(
  message: AgentMessage,
): ThreadMessageLike | null {
  const createdAt = new Date(message.createdAt);
  if (message.role === 'USER') {
    return {
      id: message.id,
      role: 'user',
      content: userTextOf(message.content),
      createdAt,
    };
  }
  if (message.role === 'ASSISTANT') {
    return assistantMessage(message.id, partsOfMessage(message.content), {
      createdAt,
      mode: modeOfMessage(message.content),
    });
  }
  return null;
}
