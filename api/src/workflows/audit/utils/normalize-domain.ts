import { parse } from "tldts";

/**
 * Extract the root domain (eTLD+1) from a URL or hostname.
 * e.g. "https://www.blog.example.co.uk/page" → "example.co.uk"
 */
export function normalizeDomain(urlOrHostname: string): string | null {
  const result = parse(urlOrHostname);
  return result.domain ?? null;
}
