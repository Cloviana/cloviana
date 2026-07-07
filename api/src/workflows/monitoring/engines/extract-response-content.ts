// Turns a raw engine response (AI Overview / LLM response / ChatGPT scrape)
// into plain text + citations. Citation excerpts are backfilled by fetching
// the cited page when the engine didn't already return a usable snippet.
import type {
  AiOverviewItem,
  LlmResponseItem,
} from "@/integrations/dataforseo/dataforseo.types";
import * as cheerio from "cheerio";
import pLimit from "p-limit";
import type { Citation } from "../monitoring.types";
import { canonicalSourceUrl } from "../fan-out/fan-out-inference-sources";

export type CitationSource = {
  url?: string | null;
  title?: string | null;
  fallbackText?: string | null;
};

const MAX_EXCERPT_CHARACTERS = 1_200;
const MAX_PAGE_BYTES = 2_000_000;
const PAGE_FETCH_CONCURRENCY = 5;
const PAGE_FETCH_TIMEOUT_MS = 10_000;
const fetchLimit = pLimit(PAGE_FETCH_CONCURRENCY);
const inFlightExcerpts = new Map<string, Promise<string | null>>();

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

async function fetchPageExcerpt(url: string): Promise<string | null> {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null;
    }

    const response = await fetch(parsedUrl, {
      headers: {
        Accept: "text/html, text/plain;q=0.9",
        "User-Agent": "Mozilla/5.0 (compatible; ClovianaBot/1.0)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(PAGE_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain")
    ) {
      return null;
    }
    if (contentLength > MAX_PAGE_BYTES) return null;

    const body = await response.text();
    if (Buffer.byteLength(body) > MAX_PAGE_BYTES) return null;

    if (contentType.includes("text/plain")) {
      return normalizeText(body).slice(0, MAX_EXCERPT_CHARACTERS) || null;
    }

    const $ = cheerio.load(body);
    $(
      "script, style, noscript, svg, nav, footer, header, aside, form",
    ).remove();

    const paragraphs = $("article p, main p, [role='main'] p, p")
      .toArray()
      .map((element) => normalizeText($(element).text()))
      .filter((text) => text.length >= 80)
      .slice(0, 3);
    const pageText =
      paragraphs.join(" ") ||
      normalizeText($("article, main, [role='main'], body").first().text());

    return pageText.slice(0, MAX_EXCERPT_CHARACTERS) || null;
  } catch {
    return null;
  }
}

function pageExcerpt(url: string): Promise<string | null> {
  // Dedupe concurrent fetches of the same URL (common when several engine
  // responses cite the same page) instead of hitting it once per citation.
  const cacheKey = canonicalSourceUrl(url);
  const inFlight = inFlightExcerpts.get(cacheKey);
  if (inFlight) return inFlight;

  const request = fetchLimit(() => fetchPageExcerpt(url)).finally(() => {
    if (inFlightExcerpts.get(cacheKey) === request) {
      inFlightExcerpts.delete(cacheKey);
    }
  });
  inFlightExcerpts.set(cacheKey, request);

  return request;
}

async function extractCitations(
  sources: CitationSource[],
): Promise<Citation[]> {
  return Promise.all(
    sources
      .filter(
        (source): source is CitationSource & { url: string } =>
          typeof source.url === "string" && source.url.trim().length > 0,
      )
      .map(async (source) => {
        const url = source.url.trim();
        const title = normalizeText(source.title ?? "");
        const excerpt =
          (await pageExcerpt(url)) ||
          normalizeText(source.fallbackText ?? "") ||
          title ||
          url;

        return { url, title, excerpt };
      }),
  );
}

export async function extractResponseContent(
  content: string,
  sources: CitationSource[],
): Promise<{
  content: string;
  citations: Citation[];
}> {
  return {
    content,
    citations: await extractCitations(sources),
  };
}

export async function extractLlmResponseContent(
  items: LlmResponseItem[] | null = [],
): Promise<{
  content: string;
  citations: Citation[];
}> {
  const sections = (items ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.sections ?? []);

  return extractResponseContent(
    sections.map((section) => section.text ?? "").join("\n\n"),
    sections.flatMap((section) => section.annotations ?? []),
  );
}

export async function extractAiOverviewContent(
  aiOverview?: AiOverviewItem,
): Promise<{
  content: string;
  citations: Citation[];
}> {
  return extractResponseContent(
    aiOverview?.markdown ?? "",
    (aiOverview?.references ?? []).map((reference) => ({
      url: reference.url,
      title: reference.title,
      fallbackText: reference.text,
    })),
  );
}
