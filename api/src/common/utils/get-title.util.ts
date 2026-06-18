export async function getTitle(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(3000),
    });
    const html = await res.text();
    const match = html.match(/<title>(.*?)<\/title>/i);

    return match ? match[1].trim() : url;
  } catch {
    return url;
  }
}
