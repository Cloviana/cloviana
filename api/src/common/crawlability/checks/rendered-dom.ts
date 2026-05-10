import { chromium } from "playwright";
import { USER_AGENT } from "../constants";
import type { HtmlSnapshot } from "../types";

type RenderedDomEvaluation = {
  title: string;
  metaDescription: string;
  h1: string;
  headings: string[];
  bodyText: string;
  links: string[];
  internalLinkCount: number;
  jsonLdCount: number;
  totalElements: number;
  emptyElements: number;
};

export async function getRenderedDomSnapshot(
  url: string,
): Promise<HtmlSnapshot> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ userAgent: USER_AGENT });
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page
      .waitForLoadState("load", { timeout: 5000 })
      .catch(() => undefined);
    await page.waitForTimeout(2000);

    const rendered = (await page.evaluate(`(() => {
      const normalizeText = (value) => (value ?? "").replace(/\\s+/g, " ").trim();
      const links = [...document.querySelectorAll("a[href]")]
        .map((anchor) => anchor.href)
        .filter(Boolean);
      const origin = window.location.origin;

      return {
        title: normalizeText(document.title),
        metaDescription:
          document
            .querySelector('meta[name="description"]')
            ?.getAttribute("content")
            ?.trim() ?? "",
        h1: normalizeText(document.querySelector("h1")?.textContent),
        headings: [...document.querySelectorAll("h1, h2, h3")]
          .map((heading) => normalizeText(heading.textContent))
          .filter(Boolean),
        bodyText: normalizeText(document.body?.innerText),
        links,
        internalLinkCount: links.filter((link) => {
          try {
            return new URL(link, window.location.href).origin === origin;
          } catch {
            return false;
          }
        }).length,
        jsonLdCount: document.querySelectorAll(
          'script[type="application/ld+json"]',
        ).length,
        totalElements: document.body?.querySelectorAll("*").length ?? 0,
        emptyElements: [...(document.body?.querySelectorAll("*") ?? [])].filter(
          (element) => normalizeText(element.textContent) === "",
        ).length,
      };
    })()`)) as RenderedDomEvaluation;
    const emptyElementRatio =
      rendered.totalElements === 0
        ? 1
        : Number((rendered.emptyElements / rendered.totalElements).toFixed(2));

    return {
      url,
      finalUrl: page.url(),
      status: response?.status() ?? 0,
      redirected: page.url() !== url,
      title: rendered.title,
      metaDescription: rendered.metaDescription,
      h1: rendered.h1,
      headings: rendered.headings,
      bodyTextLength: rendered.bodyText.length,
      firstWords: rendered.bodyText.slice(0, 500),
      linkCount: rendered.links.length,
      internalLinkCount: rendered.internalLinkCount,
      jsonLdCount: rendered.jsonLdCount,
      emptyElementRatio,
    };
  } finally {
    await browser.close();
  }
}
