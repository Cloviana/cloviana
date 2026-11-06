export const REFERENCE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/markdown",
] as const;
export const MAX_REFERENCE_BYTES = 2 * 1024 * 1024;
export const MAX_REFERENCE_NAME_CHARACTERS = 200;
export const MAX_RUN_REFERENCES = 4;
export const REFERENCE_UPLOAD_URL_TTL_SECONDS = 300;
export const REFERENCE_COMPLETION_WINDOW_MS = 15 * 60_000;

export function isReferenceMimeType(value: string): boolean {
  return REFERENCE_MIME_TYPES.some((mime) => mime === value);
}

export function isValidReference(input: {
  name: string;
  mimeType: string;
  size: number;
}): boolean {
  return (
    input.name.length > 0 &&
    Array.from(input.name).length <= MAX_REFERENCE_NAME_CHARACTERS &&
    isReferenceMimeType(input.mimeType) &&
    Number.isSafeInteger(input.size) &&
    input.size >= 1 &&
    input.size <= MAX_REFERENCE_BYTES
  );
}
