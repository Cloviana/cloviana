import { describe, expect, it } from 'vitest';

import {
  attachmentProblem,
  isImage,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
} from './attachment-rules';

const file = (type: string, size = 100, name = 'a.png') => ({
  name,
  type,
  size,
});

describe('attachmentProblem', () => {
  it('accepts supported images and text', () => {
    for (const type of [
      'image/png',
      'image/jpeg',
      'image/webp',
      'text/plain',
      'text/markdown',
    ]) {
      expect(attachmentProblem(file(type), 0)).toBeNull();
    }
  });

  it('refuses other types, naming the file', () => {
    expect(attachmentProblem(file('application/pdf', 100, 'x.pdf'), 0)).toMatch(
      /x\.pdf/,
    );
    expect(attachmentProblem(file('image/gif'), 0)).not.toBeNull();
  });

  it('refuses empty and oversized files', () => {
    expect(attachmentProblem(file('image/png', 0), 0)).toMatch(/empty/);
    expect(
      attachmentProblem(file('image/png', MAX_ATTACHMENT_BYTES + 1), 0),
    ).toMatch(/2 MB/);
    expect(
      attachmentProblem(file('image/png', MAX_ATTACHMENT_BYTES), 0),
    ).toBeNull();
  });

  it('stops at the limit per message', () => {
    expect(
      attachmentProblem(file('image/png'), MAX_ATTACHMENTS - 1),
    ).toBeNull();
    expect(attachmentProblem(file('image/png'), MAX_ATTACHMENTS)).toMatch(
      /up to/,
    );
  });
});

describe('isImage', () => {
  it('tells images from text', () => {
    expect(isImage('image/webp')).toBe(true);
    expect(isImage('text/plain')).toBe(false);
  });
});
