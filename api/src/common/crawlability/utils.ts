import { XMLParser } from "fast-xml-parser";
import {
  MAX_SITEMAPS_TO_FETCH,
  SITEMAP_STALE_DAYS,
  USER_AGENT,
} from "./constants";
import type { SitemapEntry, SitemapUrlHealth } from "./types";

// ── URL helpers ───────────────────────────────────────────────────────────────

export function buildEvidence(parts: string[]): string {
  return parts.filter(Boolean).join(" ");
}

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";

  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}

export function toAbsoluteUrl(domain: string, path: string): string {
  return new URL(path, domain).toString();
}

export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

export async function fetchText(url: string): Promise<{
  status: number;
  ok: boolean;
  finalUrl: string;
  redirected: boolean;
  text: string;
}> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(20000),
  });

  return {
    status: res.status,
    ok: res.ok,
    finalUrl: res.url,
    redirected: res.redirected,
    text: await res.text(),
  };
}

export async function fetchUrlStatus(url: string): Promise<SitemapUrlHealth> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });

    return {
      url,
      status: res.status,
      redirected: res.status >= 300 && res.status < 400,
      finalUrl: res.headers.get("location") ?? res.url,
    };
  } catch (error) {
    return {
      url,
      status: null,
      redirected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ── Sitemap parser ────────────────────────────────────────────────────────────

function arrayify<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getXmlText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value !== null && "#text" in value) {
    const text = (value as { "#text"?: unknown })["#text"];
    return typeof text === "string" ? text : undefined;
  }

  return undefined;
}

function parseSitemapEntries(parsed: unknown): {
  urls: SitemapEntry[];
  sitemapUrls: string[];
} {
  const root = parsed as {
    urlset?: { url?: unknown };
    sitemapindex?: { sitemap?: unknown };
  };
  const urls = arrayify(root.urlset?.url).flatMap((item) => {
    const entry = item as { loc?: unknown; lastmod?: unknown };
    const loc = getXmlText(entry.loc)?.trim();

    return loc ? [{ loc, lastmod: getXmlText(entry.lastmod)?.trim() }] : [];
  });
  const sitemapUrls = arrayify(root.sitemapindex?.sitemap).flatMap((item) => {
    const entry = item as { loc?: unknown };
    const loc = getXmlText(entry.loc)?.trim();

    return loc ? [loc] : [];
  });

  return { urls, sitemapUrls };
}

export function isLastmodStale(lastmod: string, now = new Date()): boolean {
  const parsed = new Date(lastmod);
  if (Number.isNaN(parsed.getTime())) return true;

  const ageMs = now.getTime() - parsed.getTime();
  const staleMs = SITEMAP_STALE_DAYS * 24 * 60 * 60 * 1000;

  return ageMs > staleMs;
}

export async function crawlSitemapTree(startUrl: string): Promise<{
  foundSitemaps: string[];
  entries: SitemapEntry[];
  malformedSitemaps: string[];
}> {
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const queue = [startUrl];
  const visited = new Set<string>();
  const foundSitemaps: string[] = [];
  const entries: SitemapEntry[] = [];
  const malformedSitemaps: string[] = [];

  while (queue.length > 0 && visited.size < MAX_SITEMAPS_TO_FETCH) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl || visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);

    try {
      const res = await fetch(sitemapUrl, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) continue;

      foundSitemaps.push(sitemapUrl);

      const extracted = parseSitemapEntries(parser.parse(await res.text()));
      entries.push(...extracted.urls);
      queue.push(...extracted.sitemapUrls.filter((url) => !visited.has(url)));
    } catch {
      malformedSitemaps.push(sitemapUrl);
    }
  }

  return { foundSitemaps, entries, malformedSitemaps };
}
