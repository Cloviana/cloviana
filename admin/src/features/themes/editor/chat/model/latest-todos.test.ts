import { describe, expect, it } from 'vitest';

import { latestTodos } from './latest-todos';
import type { Part } from './part';

describe('latestTodos', () => {
  it('returns the most recent checklist', () => {
    const parts: Part[] = [
      {
        id: 'todos',
        type: 'todos',
        items: [{ content: 'a', status: 'pending' }],
      },
      { id: 'x', type: 'text', text: 'hi' },
    ];
    expect(latestTodos(parts)?.items).toHaveLength(1);
  });

  it('is undefined when there is none', () => {
    expect(
      latestTodos([{ id: 'x', type: 'text', text: 'hi' }]),
    ).toBeUndefined();
  });
});
