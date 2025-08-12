import { NextRequest, NextResponse } from 'next/server';

import { verifyWebhook } from '@/features/shopify/utils/verify-webhook';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { topic: string[] } },
) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
  if (!verifyWebhook(rawBody, hmacHeader)) {
    return NextResponse.json(null, { status: 401 });
  }
  const topic = params.topic.join('/');
  if (
    topic === 'customers/data_request' ||
    topic === 'customers/redact' ||
    topic === 'shop/redact'
  ) {
    return NextResponse.json(null, { status: 204 });
  }
  return NextResponse.json(null, { status: 404 });
}
