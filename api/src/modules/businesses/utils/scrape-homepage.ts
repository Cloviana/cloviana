import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeHomepage(domain: string): Promise<string> {
  const { data: html } = await axios.get<string>(`https://${domain}`, {
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AuditBot/1.0)" },
    maxRedirects: 5,
  });

  const $ = cheerio.load(html);

  const title = $("title").first().text().trim();
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ?? "";
  const headings = $("h1, h2")
    .toArray()
    .map((element) => $(element).text().replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 10);

  $("script, style, noscript, iframe").remove();

  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 20000);

  return [
    title && `Title: ${title}`,
    metaDescription && `Meta description: ${metaDescription}`,
    headings.length ? `Headings:\n${headings.join("\n")}` : "",
    bodyText,
  ]
    .filter(Boolean)
    .join("\n\n");
}
