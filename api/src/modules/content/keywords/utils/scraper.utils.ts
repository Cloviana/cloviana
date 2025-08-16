import * as cheerio from "cheerio";

export function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);
  const text = ["p", "h1", "h2", "h3", "li"]
    .map((sel) =>
      $(sel)
        .map((_, el) => $(el).text())
        .get()
        .join(" "),
    )
    .join(" ");
  return text.replace(/\s+/g, " ").trim();
}

export function normalizeDomainToUrl(domain: string): string {
  if (/^https?:\/\//.test(domain)) return domain;
  const protocol =
    domain.includes("localhost") || domain.includes(":")
      ? "http://"
      : "https://";
  return `${protocol}${domain}`;
}
