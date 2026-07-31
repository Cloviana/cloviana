import { RAW_HTML_MIN_BODY_TEXT_LENGTH } from "../constants";
import type {
  CrawlabilityCheckResult,
  HtmlContentDetails,
  HtmlSnapshot,
} from "../types";
import { buildEvidence } from "../utils";
import { getRawHtmlSnapshot } from "./raw-html";
import { getRenderedDomSnapshot } from "./rendered-dom";

function emptyComparison(): HtmlContentDetails["comparison"] {
  return {
    renderedBodyTextDelta: 0,
    renderedToRawTextRatio: null,
    renderedInternalLinkDelta: 0,
    renderedJsonLdDelta: 0,
  };
}

function compareSnapshots(
  raw: HtmlSnapshot,
  rendered: HtmlSnapshot | null,
): HtmlContentDetails["comparison"] {
  if (!rendered) {
    return emptyComparison();
  }

  return {
    renderedBodyTextDelta: rendered.bodyTextLength - raw.bodyTextLength,
    renderedToRawTextRatio:
      raw.bodyTextLength === 0
        ? null
        : Number((rendered.bodyTextLength / raw.bodyTextLength).toFixed(2)),
    renderedInternalLinkDelta:
      rendered.internalLinkCount - raw.internalLinkCount,
    renderedJsonLdDelta: rendered.jsonLdCount - raw.jsonLdCount,
  };
}

function getComparisonIssues(
  raw: HtmlSnapshot,
  rendered: HtmlSnapshot | null,
  comparison: HtmlContentDetails["comparison"],
): string[] {
  if (!rendered) {
    return ["rendered_dom_fetch_failed"];
  }

  const issues: string[] = [];

  if (
    rendered.bodyTextLength > raw.bodyTextLength * 2 &&
    comparison.renderedBodyTextDelta > 1000
  ) {
    issues.push("important_content_requires_javascript");
  }

  if (
    rendered.internalLinkCount > raw.internalLinkCount * 2 &&
    comparison.renderedInternalLinkDelta >= 5
  ) {
    issues.push("links_require_javascript");
  }

  if (raw.jsonLdCount === 0 && rendered.jsonLdCount > 0) {
    issues.push("structured_data_requires_javascript");
  }

  return issues;
}

function getRawHtmlIssues(raw: HtmlSnapshot): string[] {
  const issues: string[] = [];

  if (raw.status !== 200) {
    issues.push("raw_html_non_200");
  }
  if (raw.bodyTextLength < RAW_HTML_MIN_BODY_TEXT_LENGTH) {
    issues.push("raw_html_thin_body");
  }
  if (!raw.h1) {
    issues.push("raw_html_missing_h1");
  }
  if (!raw.title) {
    issues.push("raw_html_missing_title");
  }
  if (!raw.metaDescription) {
    issues.push("raw_html_missing_meta_description");
  }
  if (raw.emptyElementRatio >= 0.8) {
    issues.push("raw_html_mostly_empty_elements");
  }

  return issues;
}

export async function checkHtmlContent(
  url: string,
): Promise<CrawlabilityCheckResult<HtmlContentDetails>> {
  try {
    const raw = await getRawHtmlSnapshot(url);
    let rendered: HtmlSnapshot | null = null;
    let renderedError: string | undefined;

    try {
      rendered = await getRenderedDomSnapshot(url);
    } catch (error) {
      rendered = null;
      renderedError = error instanceof Error ? error.message : String(error);
    }

    const comparison = compareSnapshots(raw, rendered);
    const issues = [
      ...getRawHtmlIssues(raw),
      ...getComparisonIssues(raw, rendered, comparison),
    ];

    return {
      check: "crawlability",
      pageUrl: url,
      pass: issues.length === 0,
      issues,
      evidence: buildEvidence([
        `Fetched raw HTML for ${url} with status ${raw.status}.`,
        `Raw body text length is ${raw.bodyTextLength} characters.`,
        rendered
          ? `Rendered body text length is ${rendered.bodyTextLength} characters.`
          : `Rendered DOM snapshot could not be collected${
              renderedError ? `: ${renderedError}` : ""
            }.`,
        rendered
          ? `Rendered DOM adds ${comparison.renderedBodyTextDelta} text characters, ${comparison.renderedInternalLinkDelta} internal links, and ${comparison.renderedJsonLdDelta} JSON-LD blocks.`
          : "",
        raw.h1 ? `Raw H1: "${raw.h1}".` : "No raw H1 was found.",
      ]),
      recommendation:
        issues.length === 0
          ? "Raw HTML contains crawlable page content before JavaScript execution."
          : "Ensure key copy, headings, internal links, metadata, and structured data are present in the initial HTML response, not only after JavaScript renders.",
      raw: {
        raw,
        rendered,
        renderedError,
        comparison,
      },
    };
  } catch (error) {
    return {
      check: "crawlability",
      pageUrl: url,
      pass: false,
      issues: ["raw_html_fetch_failed"],
      evidence: `Failed to fetch raw HTML for ${url}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      recommendation:
        "Ensure the page is publicly reachable by normal HTTP clients and does not require JavaScript or bot-specific handling to return content.",
      raw: {
        raw: null,
        rendered: null,
        comparison: emptyComparison(),
      },
    };
  }
}
