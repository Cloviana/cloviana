import { NextRequest, NextResponse } from 'next/server';

import { verify } from '../_lib/verify';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { topic: string[] } },
) {
  const raw = Buffer.from(await req.arrayBuffer());
  const ok = verify(raw, req.headers.get('x-shopify-hmac-sha256'));
  if (!ok) return new NextResponse(null, { status: 401 });

  const topic = params.topic.join('/');
  if (topic === 'customers/data_request') {
    return new NextResponse(null, { status: 204 });
  }
  if (topic === 'customers/redact') {
    return new NextResponse(null, { status: 204 });
  }
  if (topic === 'shop/redact') {
    return new NextResponse(null, { status: 204 });
  }
  return new NextResponse(null, { status: 404 });
}
