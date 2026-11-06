import type { NextRequest } from 'next/server';

import { forwardSource } from '@/features/themes/editor/server';

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ slug: string; themeId: string; revisionId: string }>;
  },
) {
  const { slug, themeId, revisionId } = await params;
  return forwardSource(
    slug,
    themeId,
    `revisions/${encodeURIComponent(revisionId)}/files`,
  );
}
