import type {
  CrawlabilityCheckResult,
  CrawlabilityFinding,
  CrawlabilitySeverity,
} from "./types";
import { unique } from "./utils";

function isHomepage(url: string): boolean {
  const parsed = new URL(url);
  return parsed.pathname === "/" || parsed.pathname === "";
}

function severityForIssue(
  result: CrawlabilityCheckResult,
  issue: string,
): CrawlabilitySeverity {
  if (
    issue === "robots_blocks_all_major_bots" ||
    (result.pageUrl &&
      isHomepage(result.pageUrl) &&
      (issue === "raw_html_non_200" ||
        issue === "raw_html_thin_body" ||
        issue === "raw_html_mostly_empty_elements" ||
        issue === "raw_html_fetch_failed" ||
        issue === "important_content_requires_javascript"))
  ) {
    return "critical";
  }

  if (
    issue === "robots_blocks_major_bot" ||
    issue === "sitemap_missing_key_pages" ||
    issue === "sitemap_not_found" ||
    issue === "important_content_requires_javascript" ||
    issue === "links_require_javascript" ||
    issue === "structured_data_requires_javascript"
  ) {
    return "high";
  }

  if (
    issue.startsWith("pagespeed_") ||
    issue === "sitemap_missing_lastmod" ||
    issue === "sitemap_stale_lastmod" ||
    issue === "sitemap_url_health_failed" ||
    issue === "sitemap_malformed" ||
    issue === "raw_html_thin_body" ||
    issue === "raw_html_mostly_empty_elements" ||
    issue === "rendered_dom_fetch_failed" ||
    issue === "robots_sitemap_not_referenced"
  ) {
    return "medium";
  }

  return "low";
}

function titleForIssue(issue: string): string {
  const titles: Record<string, string> = {
    raw_html_non_200: "Page raw HTML does not return 200",
    raw_html_thin_body: "Page raw HTML has thin crawlable content",
    raw_html_missing_h1: "Page raw HTML is missing an H1",
    raw_html_missing_title: "Page raw HTML is missing a title",
    raw_html_missing_meta_description:
      "Page raw HTML is missing a meta description",
    raw_html_mostly_empty_elements: "Page raw HTML appears mostly empty",
    raw_html_fetch_failed: "Page raw HTML could not be fetched",
    important_content_requires_javascript:
      "Important page content requires JavaScript",
    links_require_javascript: "Important internal links require JavaScript",
    structured_data_requires_javascript: "Structured data requires JavaScript",
    rendered_dom_fetch_failed: "Rendered DOM could not be checked",
    robots_non_200: "robots.txt is not returning 200",
    robots_fetch_failed: "robots.txt could not be fetched",
    robots_blocks_all_major_bots: "robots.txt blocks all major crawlers",
    robots_blocks_major_bot: "robots.txt blocks a major crawler",
    robots_sitemap_not_referenced: "robots.txt does not reference a sitemap",
    sitemap_not_found: "No sitemap was found",
    sitemap_malformed: "Sitemap XML is malformed",
    sitemap_missing_key_pages: "Sitemap is missing key pages",
    sitemap_missing_lastmod: "Sitemap is missing lastmod for key pages",
    sitemap_stale_lastmod: "Sitemap lastmod is stale",
    sitemap_url_health_failed:
      "Sitemap key page URLs redirect or return non-200",
    pagespeed_api_key_missing: "PageSpeed API key is missing",
    pagespeed_non_200: "PageSpeed Insights request failed",
    pagespeed_low_performance_score: "Page has a low performance score",
    pagespeed_poor_lcp: "Page has poor LCP",
    pagespeed_poor_cls: "Page has poor CLS",
    pagespeed_poor_inp: "Page has poor INP",
    pagespeed_fetch_failed: "PageSpeed metrics could not be fetched",
  };

  return titles[issue] ?? issue.replaceAll("_", " ");
}

export function buildFindings(
  results: CrawlabilityCheckResult[],
): CrawlabilityFinding[] {
  return results.flatMap((result) =>
    unique(result.issues).map((issue) => ({
      check: result.check,
      severity: severityForIssue(result, issue),
      pageUrl: result.pageUrl,
      title: titleForIssue(issue),
      evidence: result.evidence,
      recommendation: result.recommendation,
    })),
  );
}
