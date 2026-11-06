import type { NextRequest } from 'next/server';

import { forwardSource } from '@/features/themes/editor/server';

export async function GET(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ slug: string; themeId: string; sha256: string }> },
) {
  const { slug, themeId, sha256 } = await params;
  return forwardSource(slug, themeId, `blobs/${encodeURIComponent(sha256)}`);
}
