/** What the API accepts as a reference (`api/.../domain/attachment.policy.ts`). Checked here first so a bad file never starts an upload. */
export const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/markdown',
] as const;

export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
export const MAX_ATTACHMENTS = 4;
export const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(',');

/** Why a file can't be attached, or null if it can. */
export function attachmentProblem(
  file: { name: string; type: string; size: number },
  alreadyAttached: number,
): string | null {
  if (alreadyAttached >= MAX_ATTACHMENTS) {
    return `You can attach up to ${MAX_ATTACHMENTS} files to one message.`;
  }
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name} isn't a PNG, JPEG, WebP, text or Markdown file.`;
  }
  if (file.size < 1) return `${file.name} is empty.`;
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `${file.name} is larger than 2 MB.`;
  }
  return null;
}

export const isImage = (type: string) => type.startsWith('image/');
