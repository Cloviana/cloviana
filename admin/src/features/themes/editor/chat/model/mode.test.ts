import { describe, expect, it } from 'vitest';

import { isAgentMode, MODES, modeOfMessage } from './mode';

describe('modes', () => {
  it('offers chat, plan and build, in that order', () => {
    expect(MODES.map((mode) => mode.value)).toEqual(['CHAT', 'PLAN', 'BUILD']);
  });

  it('recognises only real modes', () => {
    expect(isAgentMode('PLAN')).toBe(true);
    expect(isAgentMode('plan')).toBe(false);
    expect(isAgentMode(undefined)).toBe(false);
  });

  it('reads the mode a saved message recorded', () => {
    expect(modeOfMessage({ mode: 'PLAN' })).toBe('PLAN');
    expect(modeOfMessage({ mode: 'NOPE' })).toBeUndefined();
    expect(modeOfMessage({})).toBeUndefined();
    expect(modeOfMessage(null)).toBeUndefined();
  });
});
