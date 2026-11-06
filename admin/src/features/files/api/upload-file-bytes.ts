/** Upload directly to the short-lived storage URL returned by the API. */
export async function uploadFileBytes(
  url: string,
  contentType: string,
  file: File,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
    signal,
  });
  if (!response.ok) throw new Error('Upload failed');
}
