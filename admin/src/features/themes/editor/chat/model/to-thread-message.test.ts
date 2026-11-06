import { describe, expect, it } from 'vitest';

import type { AgentMessage } from '../../types';

import type { Part } from './part';
import { userTextOf } from './thread-text';
import {
  answerOf,
  assistantMessage,
  toThreadMessage,
} from './to-thread-message';

const message = (
  role: AgentMessage['role'],
  content: unknown,
): AgentMessage => ({
  id: 'm1',
  sequence: '1',
  role,
  content,
  createdAt: '2026-11-06T00:00:00.000Z',
});

describe('answerOf', () => {
  it('joins only the text parts', () => {
    const parts: Part[] = [
      { id: 'a', type: 'text', text: 'First.' },
      { id: 't', type: 'tool', tool: 'read', status: 'completed' },
      { id: 'b', type: 'text', text: 'Second.' },
    ];
    expect(answerOf(parts)).toBe('First.\n\nSecond.');
  });
});

describe('assistantMessage', () => {
  it('gives the library the answer and the transcript the parts', () => {
    const parts: Part[] = [
      { id: 'a', type: 'text', text: 'Done' },
      { id: 't', type: 'tool', tool: 'edit', status: 'completed' },
    ];
    const shown = assistantMessage('m', parts, { running: true });
    expect(shown).toMatchObject({
      role: 'assistant',
      content: 'Done',
      status: { type: 'running' },
      metadata: { custom: { parts } },
    });
  });

  it('is not marked running by default', () => {
    expect(assistantMessage('m', [])).not.toHaveProperty('status');
  });
});

describe('toThreadMessage', () => {
  it('shows a user message as its text', () => {
    expect(toThreadMessage(message('USER', { text: 'Hi' }))).toMatchObject({
      role: 'user',
      content: 'Hi',
    });
  });

  it('shows an assistant message from its saved parts', () => {
    const shown = toThreadMessage(
      message('ASSISTANT', {
        parts: [{ id: 'a', type: 'text', text: 'Done' }],
      }),
    );
    expect(shown).toMatchObject({ role: 'assistant', content: 'Done' });
  });

  it('still shows an older assistant message that has only text', () => {
    expect(
      toThreadMessage(message('ASSISTANT', { text: 'Old reply' })),
    ).toMatchObject({
      content: 'Old reply',
    });
  });

  it('hides system and tool messages', () => {
    expect(toThreadMessage(message('SYSTEM', {}))).toBeNull();
    expect(toThreadMessage(message('TOOL', {}))).toBeNull();
  });
});

describe('userTextOf', () => {
  it('reads the text of a saved user message', () => {
    expect(userTextOf({ text: 'Hi' })).toBe('Hi');
    expect(userTextOf(null)).toBe('');
    expect(userTextOf({ text: 3 })).toBe('');
  });
});
