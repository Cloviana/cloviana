import { USER_AGENT } from "../constants";
import type { CrawlabilityCheckResult, PageSpeedDetails } from "../types";

export async function checkPageSpeed(
  url: string,
  apiKey: string,
): Promise<CrawlabilityCheckResult<PageSpeedDetails>> {
  if (!apiKey) {
    return {
      check: "core_web_vitals",
      pageUrl: url,
      pass: false,
      issues: ["pagespeed_api_key_missing"],
      evidence: "GOOGLE_PAGESPEED_API_KEY is required but was not configured.",
      recommendation:
        "Set GOOGLE_PAGESPEED_API_KEY so Core Web Vitals can be checked through PageSpeed Insights.",
      raw: {
        url,
        status: 0,
        metrics: {
          performanceScore: null,
          lcp: null,
          cls: null,
          inp: null,
          ttfb: null,
        },
      },
    };
  }

  try {
    const endpoint = new URL(
      "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
    );
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("strategy", "mobile");
    endpoint.searchParams.set("category", "performance");
    endpoint.searchParams.set("key", apiKey);

    const res = await fetch(endpoint, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(60000),
    });
    const data = (await res.json()) as {
      lighthouseResult?: {
        categories?: { performance?: { score?: number } };
        audits?: Record<string, { numericValue?: number }>;
      };
      error?: { message?: string };
    };
    const lighthouse = data.lighthouseResult;
    const audits = lighthouse?.audits ?? {};
    const metrics = {
      performanceScore:
        typeof lighthouse?.categories?.performance?.score === "number"
          ? lighthouse.categories.performance.score * 100
          : null,
      lcp: audits["largest-contentful-paint"]?.numericValue ?? null,
      cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
      inp: audits["interaction-to-next-paint"]?.numericValue ?? null,
      ttfb: audits["server-response-time"]?.numericValue ?? null,
    };
    const issues: string[] = [];

    if (!res.ok) issues.push("pagespeed_non_200");
    if ((metrics.performanceScore ?? 0) < 70)
      issues.push("pagespeed_low_performance_score");
    if ((metrics.lcp ?? Number.POSITIVE_INFINITY) > 2500)
      issues.push("pagespeed_poor_lcp");
    if ((metrics.cls ?? Number.POSITIVE_INFINITY) > 0.1)
      issues.push("pagespeed_poor_cls");
    if (metrics.inp !== null && metrics.inp > 200)
      issues.push("pagespeed_poor_inp");

    return {
      check: "core_web_vitals",
      pageUrl: url,
      pass: issues.length === 0,
      issues,
      evidence: res.ok
        ? `PageSpeed mobile metrics for ${url}: score ${
            metrics.performanceScore?.toFixed(0) ?? "unknown"
          }, LCP ${metrics.lcp?.toFixed(0) ?? "unknown"}ms, CLS ${
            metrics.cls?.toFixed(3) ?? "unknown"
          }, INP ${metrics.inp?.toFixed(0) ?? "not reported"}ms.`
        : `PageSpeed request failed for ${url} with status ${res.status}: ${
            data.error?.message ?? "unknown error"
          }`,
      recommendation:
        issues.length === 0
          ? "Core Web Vitals are within the configured crawlability thresholds."
          : "Improve mobile page performance, especially LCP, CLS, INP, and overall Lighthouse performance score.",
      raw: { url, status: res.status, metrics },
    };
  } catch (error) {
    return {
      check: "core_web_vitals",
      pageUrl: url,
      pass: false,
      issues: ["pagespeed_fetch_failed"],
      evidence: `Failed to fetch PageSpeed metrics for ${url}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      recommendation:
        "Confirm the URL is public and retry the PageSpeed Insights request.",
      raw: {
        url,
        status: 0,
        metrics: {
          performanceScore: null,
          lcp: null,
          cls: null,
          inp: null,
          ttfb: null,
        },
      },
    };
  }
}
