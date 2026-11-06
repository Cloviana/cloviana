import { describe, expect, it } from 'vitest';

import type { AgentMessage } from '../../types';

import { promptsFrom, recall, userPromptsOf } from './prompt-history';

const prompts = ['one', 'two', 'three'];

describe('recall', () => {
  it('starts with the newest and walks back to the oldest', () => {
    const first = recall(prompts, null, 'older');
    expect(first).toEqual({ cursor: 0, text: 'three' });
    const second = recall(prompts, first.cursor, 'older');
    expect(second.text).toBe('two');
    const third = recall(prompts, second.cursor, 'older');
    expect(third.text).toBe('one');
    expect(recall(prompts, third.cursor, 'older').text).toBe('one');
  });

  it('walks forward and ends with an empty box', () => {
    expect(recall(prompts, 1, 'newer')).toEqual({ cursor: 0, text: 'three' });
    expect(recall(prompts, 0, 'newer')).toEqual({ cursor: null, text: '' });
    expect(recall(prompts, null, 'newer')).toEqual({ cursor: null, text: '' });
  });

  it('does nothing when there is no history', () => {
    expect(recall([], null, 'older')).toEqual({ cursor: null, text: '' });
  });
});

describe('promptsFrom', () => {
  it('keeps what the user sent, in order, without consecutive repeats', () => {
    expect(
      promptsFrom([
        { role: 'user', text: 'a' },
        { role: 'assistant', text: 'x' },
        { role: 'user', text: 'a' },
        { role: 'user', text: 'b' },
        { role: 'user', text: '' },
      ]),
    ).toEqual(['a', 'b']);
  });
});

describe('userPromptsOf', () => {
  it('reads the user text from saved messages', () => {
    const message = (
      role: AgentMessage['role'],
      text: string,
    ): AgentMessage => ({
      id: text,
      sequence: '1',
      role,
      content: { text },
      createdAt: '2026-11-06T00:00:00.000Z',
    });
    expect(
      userPromptsOf([
        message('USER', 'first'),
        message('ASSISTANT', 'reply'),
        message('USER', 'second'),
      ]),
    ).toEqual(['first', 'second']);
  });
});
