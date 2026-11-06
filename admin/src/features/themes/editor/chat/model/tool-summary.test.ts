import { describe, expect, it } from 'vitest';

import type { ToolPart } from './part';
import { toolLabel, toolSubject, toolSummary } from './tool-summary';

const tool = (patch: Partial<ToolPart>): ToolPart => ({
  id: 't',
  type: 'tool',
  tool: 'read',
  status: 'completed',
  ...patch,
});

describe('toolLabel', () => {
  it('uses friendly verbs and capitalises unknown tools', () => {
    expect(toolLabel('edit')).toBe('Update');
    expect(toolLabel('grep')).toBe('Search');
    expect(toolLabel('webfetch')).toBe('Webfetch');
  });
});

describe('toolSubject', () => {
  it('prefers the title and falls back to the input', () => {
    expect(toolSubject(tool({ title: 'app/page.tsx', input: 'x' }))).toBe(
      'app/page.tsx',
    );
    expect(toolSubject(tool({ input: 'Welcome' }))).toBe('Welcome');
    expect(toolSubject(tool({}))).toBe('');
  });
});

describe('toolSummary', () => {
  it('is empty until the step has run', () => {
    expect(toolSummary(tool({ status: 'running' }))).toBe('');
    expect(toolSummary(tool({ status: 'pending' }))).toBe('');
  });

  it('counts changed lines for an edit', () => {
    const diff = { path: 'a', additions: 1, deletions: 2, patch: '' };
    expect(toolSummary(tool({ tool: 'edit', diff }))).toBe(
      '1 addition, 2 removals',
    );
  });

  it('counts results for searches', () => {
    expect(toolSummary(tool({ tool: 'grep', output: 'a\nb\n\nc' }))).toBe(
      '3 results',
    );
    expect(toolSummary(tool({ tool: 'glob', output: '' }))).toBe('No results');
    expect(toolSummary(tool({ tool: 'list', output: 'one' }))).toBe('1 result');
  });

  it('reports a failure by its first line', () => {
    expect(toolSummary(tool({ status: 'error', output: 'boom\nmore' }))).toBe(
      'boom',
    );
    expect(toolSummary(tool({ status: 'error' }))).toBe('Failed');
  });

  it('reports the build and plain output', () => {
    expect(toolSummary(tool({ tool: 'build' }))).toBe('Build passed');
    expect(toolSummary(tool({ tool: 'read', output: 'Read 42 lines' }))).toBe(
      'Read 42 lines',
    );
    expect(toolSummary(tool({ tool: 'edit' }))).toBe('Done');
  });
});
