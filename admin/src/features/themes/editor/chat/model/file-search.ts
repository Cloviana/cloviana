import type { SourceFile } from '../../types';

const basename = (path: string) => path.split('/').at(-1) ?? path;

/** Higher is a better match; 0 is no match. */
function score(path: string, query: string) {
  const name = basename(path).toLowerCase();
  const full = path.toLowerCase();
  if (name === query) return 4;
  if (name.startsWith(query)) return 3;
  if (name.includes(query)) return 2;
  if (full.includes(query)) return 1;
  return 0;
}

/**
 * Files to offer for `@`. Files the code view can't show (binary or too large) are left out, since
 * pointing the agent at them would tell it nothing. An empty query lists the shortest paths first,
 * which tends to be the files that matter most in a small storefront.
 */
export function searchFiles(
  files: readonly SourceFile[],
  query: string,
  limit = 8,
): SourceFile[] {
  const text = query.trim().toLowerCase();
  const candidates = files.filter((file) => file.sha256 !== null);
  if (!text) {
    return [...candidates]
      .sort(
        (a, b) => a.path.length - b.path.length || a.path.localeCompare(b.path),
      )
      .slice(0, limit);
  }
  return candidates
    .map((file) => ({ file, score: score(file.path, text) }))
    .filter(({ score: s }) => s > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.file.path.length - b.file.path.length ||
        a.file.path.localeCompare(b.file.path),
    )
    .slice(0, limit)
    .map(({ file }) => file);
}
