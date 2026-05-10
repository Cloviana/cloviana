import robotsParser from "robots-parser";
import { CRAWLER_USER_AGENTS } from "../constants";
import type {
  CrawlabilityCheckResult,
  RobotsDetails,
  RobotsSnapshot,
} from "../types";
import { buildEvidence, fetchText, toAbsoluteUrl } from "../utils";

export async function getRobotsSnapshot(
  domain: string,
  keyPages: string[] = [toAbsoluteUrl(domain, "/")],
): Promise<RobotsSnapshot> {
  const url = toAbsoluteUrl(domain, "/robots.txt");
  const res = await fetchText(url);
  const robots = robotsParser(url, res.text);
  const sitemapUrls = robots.getSitemaps();
  const botResults = Object.fromEntries(
    CRAWLER_USER_AGENTS.map((bot) => {
      const checkedUrls = keyPages.map((pageUrl) => {
        const allowed = robots.isAllowed(pageUrl, bot) !== false;

        return {
          url: pageUrl,
          allowed,
          lineNumber: robots.getMatchingLineNumber(pageUrl, bot),
        };
      });
      const blocked = checkedUrls.some((result) => !result.allowed);

      return [
        bot,
        {
          allowed: !blocked,
          blocked,
          checkedUrls,
        },
      ];
    }),
  );
  const blockedBots = Object.entries(botResults)
    .filter(([, result]) => result.blocked)
    .map(([bot]) => bot);

  return {
    url,
    status: res.status,
    exists: res.ok,
    blockedBots,
    botResults,
    sitemapUrls,
    hasSitemapReference: sitemapUrls.length > 0,
    content: res.text,
  };
}

export async function checkRobots(
  domain: string,
  keyPages: string[] = [toAbsoluteUrl(domain, "/")],
): Promise<CrawlabilityCheckResult<RobotsDetails>> {
  const url = toAbsoluteUrl(domain, "/robots.txt");
  const issues: string[] = [];

  try {
    const snapshot = await getRobotsSnapshot(domain, keyPages);

    if (!snapshot.exists) issues.push("robots_non_200");
    if (snapshot.blockedBots.length === CRAWLER_USER_AGENTS.length) {
      issues.push("robots_blocks_all_major_bots");
    } else if (snapshot.blockedBots.length > 0) {
      issues.push("robots_blocks_major_bot");
    }
    if (!snapshot.hasSitemapReference) {
      issues.push("robots_sitemap_not_referenced");
    }

    return {
      check: "robots",
      pass: issues.length === 0,
      issues,
      evidence: buildEvidence([
        `Fetched ${url} with status ${snapshot.status}.`,
        snapshot.blockedBots.length > 0
          ? `Blocked bots: ${snapshot.blockedBots.join(", ")}.`
          : "No configured major AI/search bots appear blocked for the checked pages.",
        ...CRAWLER_USER_AGENTS.map(
          (bot) =>
            `Allowed for ${bot}: ${
              snapshot.botResults[bot]?.allowed ? "yes" : "no"
            }.`,
        ),
        `Sitemap referenced in robots.txt: ${
          snapshot.hasSitemapReference ? "yes" : "no"
        }.`,
      ]),
      recommendation:
        issues.length === 0
          ? "robots.txt is reachable and does not block the configured major AI/search crawlers."
          : "Update robots.txt so major search and AI crawlers are not disallowed from key public pages, and reference the sitemap with a Sitemap directive.",
      raw: snapshot,
    };
  } catch (error) {
    return {
      check: "robots",
      pass: false,
      issues: ["robots_fetch_failed"],
      evidence: `Failed to fetch ${url}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      recommendation:
        "Make robots.txt publicly accessible at the domain root and confirm it does not block major AI/search crawlers.",
      raw: {
        url,
        status: 0,
        exists: false,
        blockedBots: [],
        botResults: {},
        sitemapUrls: [],
        hasSitemapReference: false,
        content: "",
      },
    };
  }
}
