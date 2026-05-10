import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { HtmlSnapshot } from "../types";
import { fetchText, normalizeText } from "../utils";

function getElementText(
  $: cheerio.CheerioAPI,
  element: cheerio.Cheerio<AnyNode>,
): string {
  return normalizeText(element.text());
}

function getInternalLinkCount(url: string, links: string[]): number {
  const origin = new URL(url).origin;

  return links.filter((link) => {
    try {
      return new URL(link, url).origin === origin;
    } catch {
      return false;
    }
  }).length;
}

export async function getRawHtmlSnapshot(url: string): Promise<HtmlSnapshot> {
  const res = await fetchText(url);
  const $ = cheerio.load(res.text);
  const totalElements = $("body *").length;
  const emptyElements = $("body *")
    .toArray()
    .filter((el) => getElementText($, $(el)) === "").length;
  const emptyElementRatio =
    totalElements === 0
      ? 1
      : Number((emptyElements / totalElements).toFixed(2));

  $(
    "script:not([type='application/ld+json']), style, noscript, svg, iframe",
  ).remove();

  const title = getElementText($, $("title").first());
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ?? "";
  const h1 = getElementText($, $("h1").first());
  const headings = $("h1, h2, h3")
    .toArray()
    .map((el) => getElementText($, $(el)))
    .filter(Boolean);
  const bodyText = getElementText($, $("body"));
  const links = $("a[href]")
    .toArray()
    .flatMap((el) => {
      const href = $(el).attr("href");
      if (!href) return [];

      try {
        return [new URL(href, res.finalUrl).toString()];
      } catch {
        return [];
      }
    });
  const jsonLdCount = $('script[type="application/ld+json"]').length;

  return {
    url,
    finalUrl: res.finalUrl,
    status: res.status,
    redirected: res.redirected,
    title,
    metaDescription,
    h1,
    headings,
    bodyTextLength: bodyText.length,
    firstWords: bodyText.slice(0, 500),
    linkCount: links.length,
    internalLinkCount: getInternalLinkCount(res.finalUrl, links),
    jsonLdCount,
    emptyElementRatio,
  };
}
