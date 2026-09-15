import { canonicalizeUrl } from "@/common/utils/canonicalize-url.util";
import type { DataForSeoAiSource } from "@/integrations/dataforseo/dataforseo.types";
import * as cheerio from "cheerio";
import pLimit from "p-limit";
import type { MonitoringCitation } from "../monitoring.types";

const MAX_EXCERPT_CHARACTERS = 1_200;
const MAX_PAGE_BYTES = 2_000_000;
const PAGE_FETCH_TIMEOUT_MS = 10_000;
const limit = pLimit(5);

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getCitationExcerpt(url: string): Promise<string | null> {
  return limit(async () => {
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
      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get("content-type") ?? "";
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (
        (!contentType.includes("text/html") &&
          !contentType.includes("text/plain")) ||
        contentLength > MAX_PAGE_BYTES
      ) {
        return null;
      }

      const body = await response.text();
      if (Buffer.byteLength(body) > MAX_PAGE_BYTES) {
        return null;
      }

      if (contentType.includes("text/plain")) {
        return normalizeText(body).slice(0, MAX_EXCERPT_CHARACTERS) || null;
      }

      const page = cheerio.load(body);
      page(
        "script, style, noscript, svg, nav, footer, header, aside, form",
      ).remove();
      const text = page("article p, main p, [role='main'] p, p")
        .toArray()
        .map((element) => normalizeText(page(element).text()))
        .filter((paragraph) => paragraph.length >= 80)
        .slice(0, 3)
        .join(" ");

      return text.slice(0, MAX_EXCERPT_CHARACTERS) || null;
    } catch {
      return null;
    }
  });
}

export async function toCitation(
  source: DataForSeoAiSource,
): Promise<MonitoringCitation> {
  const title = normalizeText(source.title);
  const excerpt =
    normalizeText(source.excerpt ?? "") ||
    (await getCitationExcerpt(source.url)) ||
    title ||
    source.url;

  return {
    url: source.url,
    canonicalUrl: canonicalizeUrl(source.url),
    title,
    excerpt,
    urlType: null,
    domainType: null,
  };
}
