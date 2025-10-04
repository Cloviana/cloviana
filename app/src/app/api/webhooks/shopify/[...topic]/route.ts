import { NextRequest, NextResponse } from 'next/server';

import { verifyWebhook } from '@/features/shopify/utils/verify-webhook';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topic: string[] }> },
) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
  if (!verifyWebhook(rawBody, hmacHeader)) {
    return NextResponse.json(null, { status: 401 });
  }

  const { topic } = await params;
  const joined = topic.join('/');

  if (
    joined === 'customers/data_request' ||
    joined === 'customers/redact' ||
    joined === 'shop/redact'
  ) {
    return NextResponse.json(null, { status: 204 });
  }

  return NextResponse.json(null, { status: 404 });
}
