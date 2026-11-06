import type { SourceFile } from '../types';

const PAGE_FILE = /^(?:src\/)?app\/(?:(.*)\/)?page\.(?:tsx|jsx|ts|js|mdx)$/;

/** Static storefront URLs from the App Router's files. Dynamic routes have no URL to open. */
export function previewRoutes(files: SourceFile[]) {
  const routes = new Set<string>();
  for (const { path } of files) {
    const match = PAGE_FILE.exec(path);
    if (!match) continue;
    const segments = (match[1] ?? '').split('/').filter(Boolean);
    if (segments.some((s) => s.startsWith('[') || s.startsWith('@'))) continue;
    // Route groups such as (shop) are not part of the URL.
    const visible = segments.filter((s) => !s.startsWith('('));
    routes.add(`/${visible.join('/')}`);
  }
  return [...routes].sort();
}
