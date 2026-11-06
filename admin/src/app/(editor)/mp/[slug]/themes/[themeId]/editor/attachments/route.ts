import { NextResponse, type NextRequest } from 'next/server';

import { uploadReference } from '@/features/themes/editor/server';

// A route handler, not a Server Action: it takes a file, which a handler streams and an action
// would cap at a small body size.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const conversationId = form?.get('conversationId');
  if (!(file instanceof File) || typeof conversationId !== 'string') {
    return NextResponse.json({ error: 'Invalid upload' }, { status: 400 });
  }
  try {
    return NextResponse.json(await uploadReference(slug, conversationId, file));
  } catch {
    return NextResponse.json(
      { error: 'Could not attach the file' },
      { status: 502 },
    );
  }
}
