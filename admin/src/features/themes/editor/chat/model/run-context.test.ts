import { describe, expect, it } from 'vitest';

import {
  addMention,
  afterSend,
  chipsOf,
  dismissChip,
  EMPTY_CONTEXT,
  MAX_MENTIONS,
  toRunContext,
  type ContextSources,
} from './run-context';

const sources: ContextSources = {
  page: '/cart',
  file: 'app/cart/page.tsx',
  selection: { path: 'app/cart/page.tsx', startLine: 3, endLine: 5, text: 'x' },
};

describe('chipsOf', () => {
  it('shows what the editor is showing', () => {
    expect(chipsOf(sources, EMPTY_CONTEXT).map((chip) => chip.label)).toEqual([
      'Page /cart',
      'page.tsx',
      'page.tsx lines 3–5',
    ]);
  });

  it('says "line" for a one-line selection', () => {
    const one = {
      ...sources,
      selection: { ...sources.selection!, endLine: 3 },
    };
    expect(chipsOf(one, EMPTY_CONTEXT).at(-1)?.label).toBe('page.tsx line 3');
  });

  it('shows nothing when the editor shows nothing', () => {
    expect(chipsOf({}, EMPTY_CONTEXT)).toEqual([]);
  });

  it('lists mentions after the automatic chips', () => {
    const state = addMention(EMPTY_CONTEXT, 'app/layout.tsx');
    expect(chipsOf({ page: '/' }, state).map((chip) => chip.kind)).toEqual([
      'page',
      'mention',
    ]);
  });
});

describe('dismissing', () => {
  it('hides a chip, and brings it back for a different value', () => {
    const page = chipsOf(sources, EMPTY_CONTEXT)[0];
    const state = dismissChip(EMPTY_CONTEXT, page);
    expect(chipsOf(sources, state).some((chip) => chip.kind === 'page')).toBe(
      false,
    );
    expect(
      chipsOf({ ...sources, page: '/' }, state).some(
        (chip) => chip.kind === 'page',
      ),
    ).toBe(true);
  });

  it('removes a mention for good', () => {
    const state = addMention(EMPTY_CONTEXT, 'a.ts');
    const chip = chipsOf({}, state)[0];
    expect(dismissChip(state, chip).mentions).toEqual([]);
  });
});

describe('addMention', () => {
  it('ignores duplicates and stops at the limit', () => {
    let state = addMention(EMPTY_CONTEXT, 'a.ts');
    expect(addMention(state, 'a.ts')).toBe(state);
    for (let i = 0; i < MAX_MENTIONS + 3; i++)
      state = addMention(state, `f${i}.ts`);
    expect(state.mentions).toHaveLength(MAX_MENTIONS);
  });
});

describe('toRunContext', () => {
  it('sends what is visible and nothing dismissed', () => {
    const state = dismissChip(
      EMPTY_CONTEXT,
      chipsOf(sources, EMPTY_CONTEXT)[1],
    );
    const context = toRunContext(sources, state);
    expect(context).toMatchObject({ page: '/cart' });
    expect(context).not.toHaveProperty('file');
    expect(context?.selection?.startLine).toBe(3);
  });

  it('is undefined when there is no context at all', () => {
    expect(toRunContext({}, EMPTY_CONTEXT)).toBeUndefined();
  });

  it('clips a long selection to the API limit', () => {
    const long = {
      ...sources,
      selection: { ...sources.selection!, text: 'y'.repeat(9000) },
    };
    expect(toRunContext(long, EMPTY_CONTEXT)?.selection?.text).toHaveLength(
      4000,
    );
  });

  it('includes mentions', () => {
    const state = addMention(EMPTY_CONTEXT, 'app/layout.tsx');
    expect(toRunContext({}, state)).toEqual({ mentions: ['app/layout.tsx'] });
  });
});

describe('afterSend', () => {
  it('clears mentions but keeps dismissals', () => {
    const state = afterSend({
      dismissed: { page: '/cart' },
      mentions: ['a.ts'],
    });
    expect(state).toEqual({ dismissed: { page: '/cart' }, mentions: [] });
  });
});
