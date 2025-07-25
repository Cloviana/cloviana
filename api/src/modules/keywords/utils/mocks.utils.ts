import type { KeywordSummary } from "../keywords.interfaces";

export function mockKeywordsSummary(
  keywords: string | string[],
): KeywordSummary[] {
  const phrases = Array.isArray(keywords) ? keywords : [keywords];
  return phrases.map((kw) => ({
    phrase: kw,
    searchVolume: Math.floor(Math.random() * 10_000),
    cpc: parseFloat((Math.random() * 5).toFixed(2)),
    competition: parseFloat(Math.random().toFixed(2)),
    numberOfResults: Math.floor(Math.random() * 1_000_000),
    trend: `${Math.floor(Math.random() * 100)}%`,
    intent: Math.ceil(Math.random() * 3),
    difficulty: parseFloat((Math.random() * 100).toFixed(1)),
  }));
}
