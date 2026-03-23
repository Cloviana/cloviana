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

  $("script, style, noscript, iframe").remove();

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  return [title && `Title: ${title}`, metaDescription && `Meta description: ${metaDescription}`, bodyText]
    .filter(Boolean)
    .join("\n\n");
}