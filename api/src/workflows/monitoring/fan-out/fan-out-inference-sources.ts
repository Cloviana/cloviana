// Filters/dedupes citations down to the ones actually useful as evidence
// for fan-out query inference (drops blocked pages, boilerplate, and
// near-duplicate URLs differing only by tracking params).
import type { Citation } from "../monitoring.types";

const MIN_EXCERPT_LENGTH = 80;
const TRACKING_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "msclkid",
  "ref",
  "referrer",
]);
const WEAK_EXCERPT_PATTERNS = [
  /about\s*press\s*copyright\s*contact us/i,
  /enable javascript(?: and cookies)?/i,
  /access denied/i,
  /attention required.*cloudflare/i,
  /checking your browser/i,
  /just a moment/i,
];

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function canonicalSourceUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";

    for (const key of [...url.searchParams.keys()]) {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.startsWith("utm_") ||
        TRACKING_PARAMETERS.has(normalizedKey)
      ) {
        url.searchParams.delete(key);
      }
    }

    if (url.pathname !== "/") {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }

    return url.toString();
  } catch {
    return value.trim();
  }
}

export function isUsefulInferenceSource(source: Citation): boolean {
  const excerpt = normalizeText(source.excerpt);

  return (
    excerpt.length >= MIN_EXCERPT_LENGTH &&
    excerpt !== normalizeText(source.title) &&
    excerpt !== normalizeText(source.url) &&
    !WEAK_EXCERPT_PATTERNS.some((pattern) => pattern.test(excerpt))
  );
}

export function prepareInferenceSources(sources: Citation[]): Citation[] {
  const uniqueSources = new Map<string, Citation>();

  for (const source of sources) {
    if (!isUsefulInferenceSource(source)) continue;

    const key = canonicalSourceUrl(source.url);
    const existing = uniqueSources.get(key);
    if (!existing || source.excerpt.length > existing.excerpt.length) {
      uniqueSources.set(key, source);
    }
  }

  return [...uniqueSources.values()];
}
