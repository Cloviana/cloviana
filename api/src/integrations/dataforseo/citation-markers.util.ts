import type { DataForSeoAiSource } from "./dataforseo.types";

/**
 * Every engine reports its sources differently, so answers are normalised to a
 * single convention before anything downstream reads them:
 *
 *   a citation is a markdown link whose text is `[n]`, and nothing else in the
 *   answer is a link.
 *
 * That shape is Google's own — AI Overviews already emit `[[1]](url)` — and it
 * beats ChatGPT's `([domain](url))` because `extractMentions` reduces a link to
 * its text. Domain link text therefore leaks "ramp.com" into the visible prose,
 * where the alias matcher reads it as a mention of Ramp.
 */

/**
 * A markdown link, optionally wrapped in parentheses the way ChatGPT writes
 * them. The inner alternation allows one level of nested brackets so Google's
 * own `[[1]](url)` marker is matched whole rather than half. The lookbehind
 * keeps images — which share this syntax — out of it.
 */
const INLINE_LINK =
  /\(?(?<!!)\[((?:[^[\]]|\[[^\]]*\])*)\]\((https?:\/\/[^\s)]+)\)\)?/g;

/** Google appends its own "see more results" link, which is not a source. */
const isSearchEngineLink = (url: string) =>
  /^https?:\/\/(www\.)?google\.[^/]+\/search/i.test(url);

const citationMarker = (index: number, url: string) => `[[${index}]](${url})`;

/**
 * Perplexity leaves citations in its prose as `[1][2]`, with each number
 * pointing to the source at the same one-based position in `annotations`.
 * Turn those references into links so the shared renderer can display them as
 * source pills in the exact place Perplexity cited them.
 */
export function linkNumberedCitationMarkers(
  text: string,
  sources: DataForSeoAiSource[],
): string {
  return text.replace(
    /(?<!\[)\[([1-9]\d*)\](?!\()/g,
    (marker, rawIndex: string) => {
      const index = Number(rawIndex);
      const source = sources[index - 1];

      return source ? citationMarker(index, source.url) : marker;
    },
  );
}

/**
 * Appends citation markers to a block of text, for the engines that report
 * sources per section but never place them in the prose. Numbering here is
 * provisional — `rewriteInlineCitations` assigns the final, answer-wide numbers.
 */
export function appendCitationMarkers(
  text: string,
  sources: DataForSeoAiSource[],
): string {
  if (sources.length === 0) {
    return text;
  }

  const markers = sources
    .map((source, offset) => citationMarker(offset + 1, source.url))
    .join("");

  return `${text.trimEnd()} ${markers}`;
}

/**
 * Rewrites citations an engine already placed inline into the canonical marker,
 * returning them in the order they appear so the stored citation list matches
 * the numbering left in the text. A URL cited twice keeps its first number.
 *
 * Links to the search engine itself are dropped rather than renumbered — they
 * are navigation, not sources.
 */
export function rewriteInlineCitations(
  markdown: string,
  titleByUrl: Map<string, string> = new Map(),
): { content: string; citations: DataForSeoAiSource[] } {
  const citations: DataForSeoAiSource[] = [];
  const indexByUrl = new Map<string, number>();

  const content = markdown.replace(
    INLINE_LINK,
    (_match, _text: string, url: string) => {
      if (isSearchEngineLink(url)) {
        return "";
      }

      const existing = indexByUrl.get(url);
      if (existing !== undefined) {
        return citationMarker(existing, url);
      }

      const index = citations.length + 1;
      indexByUrl.set(url, index);
      citations.push({ url, title: titleByUrl.get(url) ?? "", excerpt: null });

      return citationMarker(index, url);
    },
  );

  return { content, citations };
}
