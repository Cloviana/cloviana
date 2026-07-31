import axios from "axios";
import * as cheerio from "cheerio";

const HOMEPAGE_TIMEOUT_MS = 10_000;
const MAX_HOMEPAGE_CHARACTERS = 20_000;
const MAX_HEADINGS = 10;

export async function scrapeHomepage(domain: string): Promise<string> {
  const { data: html } = await axios.get<string>(`https://${domain}`, {
    timeout: HOMEPAGE_TIMEOUT_MS,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ClovianaBot/1.0)" },
    maxRedirects: 5,
  });

  const page = cheerio.load(html);

  const title = page("title").first().text().trim();
  const metaDescription =
    page('meta[name="description"]').attr("content")?.trim() ?? "";
  const headings = page("h1, h2")
    .toArray()
    .map((element) => page(element).text().replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, MAX_HEADINGS);

  page("script, style, noscript, iframe").remove();

  const bodyText = page("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_HOMEPAGE_CHARACTERS);
  const sections: string[] = [];

  if (title) {
    sections.push(`Title: ${title}`);
  }
  if (metaDescription) {
    sections.push(`Meta description: ${metaDescription}`);
  }
  if (headings.length > 0) {
    sections.push(`Headings:\n${headings.join("\n")}`);
  }
  if (bodyText) {
    sections.push(bodyText);
  }

  return sections.join("\n\n");
}
