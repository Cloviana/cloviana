export const MAX_FILE_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_FILE_NAME_CHARACTERS = 255;
export const FILE_UPLOAD_CONTENT_TYPE =
  /^(image\/[a-zA-Z0-9.+-]+|video\/(mp4|webm))$/;

export function isValidFileUpload(input: {
  filename: string;
  contentType: string;
  size: number;
}): boolean {
  return (
    input.filename.length > 0 &&
    Array.from(input.filename).length <= MAX_FILE_NAME_CHARACTERS &&
    FILE_UPLOAD_CONTENT_TYPE.test(input.contentType) &&
    Number.isSafeInteger(input.size) &&
    input.size >= 1 &&
    input.size <= MAX_FILE_UPLOAD_BYTES
  );
}

export function isSupportedFileType(
  declared: string,
  detected: string,
): boolean {
  return (
    detected === declared &&
    (detected.startsWith("image/") ||
      detected === "video/mp4" ||
      detected === "video/webm")
  );
}
