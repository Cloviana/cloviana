import pLimit from "p-limit";
import { SITEMAP_CANDIDATES } from "../constants";
import type {
  CrawlabilityCheckResult,
  SitemapDetails,
  SitemapEntry,
  SitemapSnapshot,
} from "../types";
import {
  buildEvidence,
  crawlSitemapTree,
  fetchUrlStatus,
  isLastmodStale,
  normalizeUrl,
  toAbsoluteUrl,
  unique,
} from "../utils";

export async function getSitemapSnapshot(
  domain: string,
  robotsSitemapUrls: string[] = [],
): Promise<SitemapSnapshot> {
  const candidates = unique([
    ...robotsSitemapUrls,
    ...SITEMAP_CANDIDATES.map((path) => toAbsoluteUrl(domain, path)),
  ]);
  const malformedSitemaps: string[] = [];

  for (const candidate of candidates) {
    const snapshot = await crawlSitemapTree(candidate);
    malformedSitemaps.push(...snapshot.malformedSitemaps);

    if (snapshot.foundSitemaps.length === 0) {
      continue;
    }

    return {
      candidates,
      selectedCandidate: candidate,
      foundSitemaps: snapshot.foundSitemaps,
      entries: snapshot.entries,
      malformedSitemaps,
    };
  }

  return {
    candidates,
    foundSitemaps: [],
    entries: [],
    malformedSitemaps,
  };
}

function getIncludedKeyEntries(
  keyPages: string[],
  entries: SitemapEntry[],
): { page: string; entry: SitemapEntry }[] {
  const normalizedKeyPages = keyPages.map(normalizeUrl);
  const normalizedEntries = new Map(
    entries.map((entry) => [normalizeUrl(entry.loc), entry]),
  );

  return keyPages.flatMap((page, index) => {
    const entry = normalizedEntries.get(normalizedKeyPages[index] ?? page);
    return entry ? [{ page, entry }] : [];
  });
}

function getMissingPages(
  keyPages: string[],
  entries: SitemapEntry[],
): string[] {
  const normalizedKeyPages = keyPages.map(normalizeUrl);
  const normalizedEntries = new Map(
    entries.map((entry) => [normalizeUrl(entry.loc), entry]),
  );

  return keyPages.filter(
    (page, index) => !normalizedEntries.has(normalizedKeyPages[index] ?? page),
  );
}

export async function checkSitemap(
  domain: string,
  keyPages: string[],
  robotsSitemapUrls: string[] = [],
): Promise<CrawlabilityCheckResult<SitemapDetails>> {
  const issues: string[] = [];
  const snapshot = await getSitemapSnapshot(domain, robotsSitemapUrls);

  if (snapshot.foundSitemaps.length > 0) {
    const missingPages = getMissingPages(keyPages, snapshot.entries);
    const includedKeyEntries = getIncludedKeyEntries(
      keyPages,
      snapshot.entries,
    );
    const missingLastmodPages = includedKeyEntries
      .filter(({ entry }) => !entry.lastmod)
      .map(({ page }) => page);
    const staleLastmodPages = includedKeyEntries
      .filter(({ entry }) => entry.lastmod && isLastmodStale(entry.lastmod))
      .map(({ page }) => page);
    // Throttle health probes so we don't hammer the target domain.
    const urlHealthLimit = pLimit(5);
    const checkedUrlHealth = await Promise.all(
      includedKeyEntries.map(({ page }) =>
        urlHealthLimit(() => fetchUrlStatus(page)),
      ),
    );
    const unhealthyUrls = checkedUrlHealth.filter(
      (health) => health.status !== 200 || health.redirected,
    );

    if (snapshot.malformedSitemaps.length > 0) {
      issues.push("sitemap_malformed");
    }
    if (missingPages.length > 0) {
      issues.push("sitemap_missing_key_pages");
    }
    if (missingLastmodPages.length > 0) {
      issues.push("sitemap_missing_lastmod");
    }
    if (staleLastmodPages.length > 0) {
      issues.push("sitemap_stale_lastmod");
    }
    if (unhealthyUrls.length > 0) {
      issues.push("sitemap_url_health_failed");
    }

    return {
      check: "sitemap",
      pass: issues.length === 0,
      issues,
      evidence: buildEvidence([
        `Found ${snapshot.foundSitemaps.length} sitemap file(s) starting at ${snapshot.selectedCandidate}.`,
        `Extracted ${snapshot.entries.length} URL(s).`,
        missingPages.length > 0
          ? `Missing key pages: ${missingPages.join(", ")}.`
          : "All configured key pages are included.",
        missingLastmodPages.length > 0
          ? `Missing lastmod for: ${missingLastmodPages.join(", ")}.`
          : "",
        staleLastmodPages.length > 0
          ? `Stale lastmod for: ${staleLastmodPages.join(", ")}.`
          : "",
        unhealthyUrls.length > 0
          ? `Key sitemap URLs with non-200 or redirect responses: ${unhealthyUrls
              .map((h) => `${h.url} (${h.status ?? "error"})`)
              .join(", ")}.`
          : "",
      ]),
      recommendation:
        issues.length === 0
          ? "Sitemap is present, recursive indexes are readable, and key pages are included with fresh reachable URLs."
          : "Update the sitemap so every key public page is included, has a current lastmod value, and resolves directly with a 200 response.",
      raw: {
        ...snapshot,
        urlCount: snapshot.entries.length,
        missingPages,
        missingLastmodPages,
        staleLastmodPages,
        checkedUrlHealth,
      },
    };
  }

  issues.push("sitemap_not_found");

  return {
    check: "sitemap",
    pass: false,
    issues,
    evidence: `No sitemap was found at ${snapshot.candidates.join(", ")}.`,
    recommendation:
      "Publish a sitemap at /sitemap.xml or a standard sitemap index location and include all key public pages.",
    raw: {
      ...snapshot,
      foundSitemaps: [],
      entries: [],
      urlCount: snapshot.entries.length,
      missingPages: keyPages,
      missingLastmodPages: [],
      staleLastmodPages: [],
      checkedUrlHealth: [],
    },
  };
}
