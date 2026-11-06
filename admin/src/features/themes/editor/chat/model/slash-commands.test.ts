import { describe, expect, it } from 'vitest';

import { filterCommands, SLASH_COMMANDS } from './slash-commands';

describe('filterCommands', () => {
  it('lists every command for an empty query', () => {
    expect(filterCommands('')).toEqual(SLASH_COMMANDS);
  });

  it('matches by the start of the name, with or without the slash', () => {
    expect(filterCommands('un').map((c) => c.id)).toEqual(['undo']);
    expect(filterCommands('/re').map((c) => c.id)).toEqual(['redo']);
  });

  it('only looks at descriptions once the query is long enough to mean something', () => {
    expect(filterCommands('un').map((c) => c.id)).toEqual(['undo']);
  });

  it('also matches words in the description', () => {
    expect(filterCommands('version').map((c) => c.id)).toEqual(['history']);
  });

  it('returns nothing for an unknown command', () => {
    expect(filterCommands('zzz')).toEqual([]);
  });
});
