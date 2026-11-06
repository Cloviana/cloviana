import { describe, expect, it } from 'vitest';

import type { AgentMessage, Revision } from '../../types';

import { revisionOfMessage, rewindTargets } from './rewind';

const message = (
  id: string,
  role: AgentMessage['role'],
  content: unknown = {},
): AgentMessage => ({
  id,
  sequence: id,
  role,
  content,
  createdAt: '2026-11-06T00:00:00Z',
});

const revision = (id: string, parent: string | null): Revision => ({
  id,
  commitSha: id,
  parentRevisionId: parent,
  message: null,
  origin: 'AGENT',
  createdAt: '2026-11-06T00:00:00Z',
});

describe('rewindTargets', () => {
  const revisions = [
    revision('r0', null),
    revision('r1', 'r0'),
    revision('r2', 'r1'),
  ];

  it('points each message at the revision before its run', () => {
    const targets = rewindTargets(
      [
        message('u1', 'USER'),
        message('a1', 'ASSISTANT', { revisionId: 'r1' }),
        message('u2', 'USER'),
        message('a2', 'ASSISTANT', { revisionId: 'r2' }),
      ],
      revisions,
    );
    expect(targets.get('u1')).toBe('r0');
    expect(targets.get('u2')).toBe('r1');
  });

  it('has nothing for a run that saved no revision', () => {
    const targets = rewindTargets(
      [message('u1', 'USER'), message('a1', 'ASSISTANT', { parts: [] })],
      revisions,
    );
    expect(targets.size).toBe(0);
  });

  it('has nothing when the revision has no parent or is not in the list', () => {
    expect(
      rewindTargets(
        [message('u', 'USER'), message('a', 'ASSISTANT', { revisionId: 'r0' })],
        revisions,
      ).size,
    ).toBe(0);
    expect(
      rewindTargets(
        [
          message('u', 'USER'),
          message('a', 'ASSISTANT', { revisionId: 'gone' }),
        ],
        revisions,
      ).size,
    ).toBe(0);
  });

  it('matches each reply to the message just before it', () => {
    const targets = rewindTargets(
      [
        message('u1', 'USER'),
        message('u2', 'USER'),
        message('a2', 'ASSISTANT', { revisionId: 'r2' }),
      ],
      revisions,
    );
    expect(targets.has('u1')).toBe(false);
    expect(targets.get('u2')).toBe('r1');
  });
});

describe('revisionOfMessage', () => {
  it('reads the saved revision id', () => {
    expect(revisionOfMessage({ revisionId: 'r1' })).toBe('r1');
    expect(revisionOfMessage({ revisionId: 3 })).toBeUndefined();
    expect(revisionOfMessage(null)).toBeUndefined();
  });
});
