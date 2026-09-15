import { parse } from "tldts";

/**
 * Extract the root domain (eTLD+1) from a URL or hostname.
 * e.g. "https://www.blog.example.co.uk/page" -> "example.co.uk"
 */
export function normalizeDomain(urlOrHostname: string): string | null {
  const result = parse(urlOrHostname);
  return result.domain ?? null;
}

/**
 * Root domain, falling back to the raw value when it cannot be parsed.
 * The comparison form used whenever two stored domains are matched up.
 */
export function toRootDomain(urlOrHostname: string): string {
  return normalizeDomain(urlOrHostname) ?? urlOrHostname;
}

/**
 * Extract the normalized hostname while preserving official subdomains.
 * e.g. "https://analytics.google.com/path" -> "analytics.google.com"
 */
export function normalizeHostname(urlOrHostname: string): string | null {
  const result = parse(urlOrHostname);
  return result.hostname ?? null;
}
