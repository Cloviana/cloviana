import { describe, expect, it } from 'vitest';

import { dequeue, enqueue, removeQueued, takeBack } from './message-queue';

describe('message queue', () => {
  it('keeps messages in the order they were typed', () => {
    const queue = enqueue(enqueue([], 'first', 'a'), 'second', 'b');
    expect(queue.map((m) => m.text)).toEqual(['first', 'second']);
  });

  it('ignores empty messages and trims the rest', () => {
    expect(enqueue([], '   ', 'a')).toEqual([]);
    expect(enqueue([], '  hi  ', 'a')).toEqual([{ id: 'a', text: 'hi' }]);
  });

  it('removes one message by id', () => {
    const queue = enqueue(enqueue([], 'one', 'a'), 'two', 'b');
    expect(removeQueued(queue, 'a')).toEqual([{ id: 'b', text: 'two' }]);
    expect(removeQueued(queue, 'missing')).toEqual(queue);
  });

  it('dequeues from the front', () => {
    const queue = enqueue(enqueue([], 'one', 'a'), 'two', 'b');
    const { next, rest } = dequeue(queue);
    expect(next).toEqual({ id: 'a', text: 'one' });
    expect(rest).toEqual([{ id: 'b', text: 'two' }]);
    expect(dequeue([]).next).toBeUndefined();
  });

  it('takes everything back as one draft, a line each', () => {
    const queue = enqueue(enqueue([], 'one', 'a'), 'two', 'b');
    expect(takeBack(queue)).toBe('one\ntwo');
    expect(takeBack([])).toBe('');
  });
});
