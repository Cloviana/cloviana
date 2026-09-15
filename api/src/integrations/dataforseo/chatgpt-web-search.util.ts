import type { ChatGptScrapeResult } from "./dataforseo.types";

function isHttpUrl(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function didChatGptScrapeUseWebSearch(
  result: ChatGptScrapeResult,
): boolean {
  const hasSearchResults = result.search_results?.some(({ url }) =>
    isHttpUrl(url),
  );
  const hasTopLevelSources = result.sources?.some(({ url }) => isHttpUrl(url));
  const hasNestedSources = result.items.some(
    (item) =>
      "sources" in item && item.sources?.some(({ url }) => isHttpUrl(url)),
  );
  const hasFanOutQueries = result.fan_out_queries?.some(
    (query) => query.trim().length > 0,
  );

  return Boolean(
    hasSearchResults ||
      hasTopLevelSources ||
      hasNestedSources ||
      hasFanOutQueries,
  );
}
