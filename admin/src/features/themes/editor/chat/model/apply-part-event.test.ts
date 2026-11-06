import { describe, expect, it } from 'vitest';

import { applyPartEvent } from './apply-part-event';
import {
  parsePartEvent,
  partsOfMessage,
  type Part,
  type PartEvent,
} from './part';

const upsert = (part: Part): PartEvent => ({ type: 'part.upsert', part });
const delta = (id: string, text: string): PartEvent => ({
  type: 'part.delta',
  id,
  text,
});

describe('applyPartEvent', () => {
  it('appends a new part and replaces a known one in place', () => {
    const started = applyPartEvent(
      [],
      upsert({ id: 't', type: 'tool', tool: 'read', status: 'running' }),
    );
    const withText = applyPartEvent(
      started,
      upsert({ id: 'a', type: 'text', text: 'Hi' }),
    );
    const done = applyPartEvent(
      withText,
      upsert({ id: 't', type: 'tool', tool: 'read', status: 'completed' }),
    );
    expect(done.map((part) => part.id)).toEqual(['t', 'a']);
    expect(done[0]).toMatchObject({ status: 'completed' });
  });

  it('appends deltas to text and reasoning only', () => {
    const parts: Part[] = [
      { id: 'a', type: 'text', text: 'Hel' },
      { id: 'r', type: 'reasoning', text: 'think', startedAt: 1 },
      { id: 't', type: 'tool', tool: 'read', status: 'running' },
    ];
    const next = applyPartEvent(
      applyPartEvent(
        applyPartEvent(parts, delta('a', 'lo')),
        delta('r', 'ing'),
      ),
      delta('t', 'ignored'),
    );
    expect(next[0]).toMatchObject({ text: 'Hello' });
    expect(next[1]).toMatchObject({ text: 'thinking' });
    expect(next[2]).toEqual(parts[2]);
  });

  it('ignores a delta for a part it has not seen', () => {
    expect(applyPartEvent([], delta('missing', 'x'))).toEqual([]);
  });

  it('never mutates its input', () => {
    const parts: Part[] = [{ id: 'a', type: 'text', text: 'x' }];
    const frozen = Object.freeze(parts.map((part) => Object.freeze(part)));
    expect(() => applyPartEvent(frozen, delta('a', 'y'))).not.toThrow();
    expect(parts[0]).toMatchObject({ text: 'x' });
  });
});

describe('parsePartEvent', () => {
  it('parses upserts and deltas', () => {
    expect(
      parsePartEvent(
        'part.upsert',
        JSON.stringify({ part: { id: 'a', type: 'text', text: 'Hi' } }),
      ),
    ).toEqual({
      type: 'part.upsert',
      part: { id: 'a', type: 'text', text: 'Hi' },
    });
    expect(
      parsePartEvent('part.delta', JSON.stringify({ id: 'a', text: 'x' })),
    ).toEqual({ type: 'part.delta', id: 'a', text: 'x' });
  });

  it('rejects malformed JSON, unknown events and wrong shapes', () => {
    expect(parsePartEvent('part.upsert', '{oops')).toBeNull();
    expect(parsePartEvent('run.queued', '{}')).toBeNull();
    expect(
      parsePartEvent('part.upsert', JSON.stringify({ part: { type: 'nope' } })),
    ).toBeNull();
    expect(parsePartEvent('part.delta', JSON.stringify({ id: 1 }))).toBeNull();
  });
});

describe('partsOfMessage', () => {
  it('reads saved parts and skips invalid ones', () => {
    const parts = partsOfMessage({
      parts: [{ id: 'a', type: 'text', text: 'Hi' }, { type: 'bogus' }],
    });
    expect(parts).toEqual([{ id: 'a', type: 'text', text: 'Hi' }]);
  });

  it('turns an older text-only message into one text part', () => {
    expect(partsOfMessage({ text: 'Done.' })).toEqual([
      { id: 'text', type: 'text', text: 'Done.' },
    ]);
  });

  it('returns nothing for empty or unrecognised content', () => {
    expect(partsOfMessage(null)).toEqual([]);
    expect(partsOfMessage({ text: '' })).toEqual([]);
    expect(partsOfMessage('plain')).toEqual([]);
  });
});
