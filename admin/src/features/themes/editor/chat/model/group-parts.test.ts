import { describe, expect, it } from 'vitest';

import { groupParts } from './group-parts';
import type { Part } from './part';

const tool = (
  id: string,
  name: string,
  status: 'running' | 'completed' | 'error' = 'completed',
): Part => ({ id, type: 'tool', tool: name, status });

describe('groupParts', () => {
  it('collapses consecutive finished lookups of one kind', () => {
    const blocks = groupParts([
      tool('1', 'read'),
      tool('2', 'read'),
      tool('3', 'read'),
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      kind: 'group',
      id: '1',
      label: 'Read 3 files',
    });
  });

  it('leaves a single lookup alone', () => {
    expect(groupParts([tool('1', 'read')])).toEqual([
      { kind: 'part', part: tool('1', 'read') },
    ]);
  });

  it('keeps a running or failed lookup visible on its own', () => {
    const blocks = groupParts([
      tool('1', 'read'),
      tool('2', 'read'),
      tool('3', 'read', 'running'),
      tool('4', 'read', 'error'),
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(['group', 'part', 'part']);
  });

  it('never groups edits or commands', () => {
    const blocks = groupParts([
      tool('1', 'edit'),
      tool('2', 'edit'),
      tool('3', 'bash'),
      tool('4', 'bash'),
    ]);
    expect(blocks.every((b) => b.kind === 'part')).toBe(true);
  });

  it('starts a new group when the kind changes', () => {
    const blocks = groupParts([
      tool('1', 'read'),
      tool('2', 'read'),
      tool('3', 'grep'),
      tool('4', 'grep'),
    ]);
    expect(blocks).toMatchObject([
      { kind: 'group', label: 'Read 2 files' },
      { kind: 'group', label: 'Searched 2 times' },
    ]);
  });

  it('breaks a group at text so the story stays in order', () => {
    const text: Part = { id: 't', type: 'text', text: 'Now editing' };
    const blocks = groupParts([
      tool('1', 'read'),
      tool('2', 'read'),
      text,
      tool('3', 'read'),
      tool('4', 'read'),
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(['group', 'part', 'group']);
  });
});
