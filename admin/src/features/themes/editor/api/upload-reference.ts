import 'server-only';

import { api } from '@/lib/api/api-client';

import {
  ACCEPTED_TYPES,
  MAX_ATTACHMENT_BYTES,
} from '../chat/model/attachment-rules';

/** A file the user attached, now stored and ready to be included in a run. */
export interface UploadedReference {
  id: string;
  name: string;
  mimeType: string;
}

/**
 * Stores one reference file in three steps: ask the API for a private upload address, send the
 * bytes there, then tell the API it is done so it can check what actually arrived. The browser
 * never talks to storage, so it needs no storage permissions.
 */
export async function uploadReference(
  slug: string,
  conversationId: string,
  file: File,
): Promise<UploadedReference> {
  // The API checks again; this just avoids reading a file that is already known to be refused.
  if (
    !(ACCEPTED_TYPES as readonly string[]).includes(file.type) ||
    file.size < 1 ||
    file.size > MAX_ATTACHMENT_BYTES
  ) {
    throw new Error('Unsupported reference file');
  }
  const base = `/marketplaces/${encodeURIComponent(slug)}/assistant/conversations/${encodeURIComponent(conversationId)}/attachments`;
  const prepared = await api.post<{ attachmentId: string; uploadUrl: string }>(
    base,
    { name: file.name.slice(0, 200), mimeType: file.type, size: file.size },
  );
  const sent = await fetch(prepared.uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': file.type },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!sent.ok) throw new Error('The upload failed');
  await api.post(
    `${base}/${encodeURIComponent(prepared.attachmentId)}/complete`,
    {},
  );
  return { id: prepared.attachmentId, name: file.name, mimeType: file.type };
}
