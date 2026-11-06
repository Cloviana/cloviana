import { describe, expect, it } from 'vitest';

import { searchFiles } from './file-search';

const file = (path: string, sha256: string | null = 'h') => ({
  path,
  size: 1,
  sha256,
});
const FILES = [
  file('app/page.tsx'),
  file('app/cart/page.tsx'),
  file('app/layout.tsx'),
  file('app/globals.css'),
  file('public/logo.png', null),
  file('package.json'),
];

describe('searchFiles', () => {
  it('ranks an exact name above a prefix, above a path match', () => {
    const found = searchFiles(FILES, 'page.tsx').map((f) => f.path);
    expect(found).toEqual(['app/page.tsx', 'app/cart/page.tsx']);
    expect(searchFiles(FILES, 'lay').map((f) => f.path)[0]).toBe(
      'app/layout.tsx',
    );
    expect(searchFiles(FILES, 'cart').map((f) => f.path)).toEqual([
      'app/cart/page.tsx',
    ]);
  });

  it('is case-insensitive and ignores surrounding space', () => {
    expect(searchFiles(FILES, '  LAYOUT ').map((f) => f.path)).toEqual([
      'app/layout.tsx',
    ]);
  });

  it("never offers a file the code view can't show", () => {
    expect(searchFiles(FILES, 'logo')).toEqual([]);
    expect(searchFiles(FILES, '').some((f) => f.path.endsWith('.png'))).toBe(
      false,
    );
  });

  it('lists short paths first when nothing is typed, up to the limit', () => {
    const found = searchFiles(
      [
        file('app/cart/deep/page.tsx'),
        file('a.ts'),
        file('app/x.ts'),
        file('app/y/z.ts'),
      ],
      '',
      3,
    ).map((f) => f.path);
    expect(found).toEqual(['a.ts', 'app/x.ts', 'app/y/z.ts']);
  });

  it('returns nothing when nothing matches', () => {
    expect(searchFiles(FILES, 'zzz')).toEqual([]);
  });
});
