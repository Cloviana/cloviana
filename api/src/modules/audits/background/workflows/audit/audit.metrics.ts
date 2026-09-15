import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import {
  computeDomainMetrics,
  computeRate,
} from "@/common/visibility/visibility-metric-calculator";
import type {
  AuditPrompt,
  AuditPromptCoverage,
  AuditReport,
  AuditRunResult,
  BrandVisibility,
  CitedDomain,
  CitedPage,
  EngineResult,
  MentionedBrand,
  SentimentResult,
} from "./audit.types";

const ENGINES = ["google-aio", "chatgpt", "perplexity"] as const;
const MISSING_DESCRIPTION = "Click this preview to learn more";

function normalizedDomain(domain: string): string {
  return normalizeDomain(domain) ?? domain;
}

function visibilityResponses(responses: EngineResult[]) {
  return responses.map((response) => ({
    citations: response.sources.map(({ url }) => ({ url })),
    mentions: response.mentions.map(({ domain }) => ({ domain })),
  }));
}

export function buildPromptCoverage(
  prompts: AuditPrompt[],
  responses: EngineResult[],
  targetDomain: string,
): AuditPromptCoverage[] {
  return prompts.map((prompt) => {
    const successfulByEngine = new Map(
      responses
        .filter((response) => response.promptId === prompt.id)
        .map((response) => [response.engine, response] as const),
    );
    const metrics = computeDomainMetrics(
      targetDomain,
      visibilityResponses([...successfulByEngine.values()]),
    );

    return {
      prompt: prompt.text,
      mentionRate: metrics.mentionRate,
      citationRate: metrics.citationShare,
    };
  });
}

function buildTopPages(
  responses: EngineResult[],
  totalResponses: number,
): CitedPage[] {
  const pages = new Map<
    string,
    { count: number; title: string; description: string }
  >();

  for (const response of responses) {
    const seen = new Set<string>();

    for (const source of response.sources) {
      if (seen.has(source.url)) {
        continue;
      }
      seen.add(source.url);

      const existing = pages.get(source.url);
      if (existing) {
        existing.count += 1;
        if (!existing.title && source.title) {
          existing.title = source.title;
        }
        if (!existing.description && source.description) {
          existing.description = source.description;
        }
      } else {
        pages.set(source.url, {
          count: 1,
          title: source.title,
          description: source.description,
        });
      }
    }
  }

  return [...pages.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([url, page], index) => ({
      position: index + 1,
      url,
      title: page.title,
      description: page.description || MISSING_DESCRIPTION,
      domain: normalizedDomain(url),
      citationShare: computeRate(page.count, totalResponses),
    }));
}

function buildCitationLeaderboard(
  responses: EngineResult[],
  totalResponses: number,
  targetDomain: string,
): CitedDomain[] {
  const counts = new Map<string, number>();

  for (const response of responses) {
    const seen = new Set<string>();

    for (const source of response.sources) {
      const domain = normalizedDomain(source.url);
      if (seen.has(domain)) {
        continue;
      }
      seen.add(domain);
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
    }
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const ranks = new Map(sorted.map(([domain], index) => [domain, index + 1]));
  const leaderboard = sorted.slice(0, 6).map(([domain, count]) => ({
    position: ranks.get(domain) ?? 1,
    domain,
    citationShare: computeRate(count, totalResponses),
  }));

  if (!leaderboard.some(({ domain }) => domain === targetDomain)) {
    const position = ranks.get(targetDomain);
    if (position !== undefined) {
      leaderboard.push({
        position,
        domain: targetDomain,
        citationShare: computeRate(
          counts.get(targetDomain) ?? 0,
          totalResponses,
        ),
      });
    }
  }

  return leaderboard;
}

function buildVisibilityLeaderboard(
  responses: EngineResult[],
  totalResponses: number,
  target: { domain: string; name: string },
): MentionedBrand[] {
  const mentions = new Map<string, { count: number; name: string | null }>();

  for (const response of responses) {
    const seen = new Set<string>();

    for (const mention of response.mentions) {
      const domain = normalizedDomain(mention.domain);
      if (seen.has(domain)) {
        continue;
      }
      seen.add(domain);

      const existing = mentions.get(domain);
      if (existing) {
        existing.count += 1;
      } else {
        mentions.set(domain, { count: 1, name: mention.name });
      }
    }
  }

  const sorted = [...mentions.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  );
  const ranks = new Map(sorted.map(([domain], index) => [domain, index + 1]));
  const leaderboard = sorted.slice(0, 6).map(([domain, mention]) => ({
    position: ranks.get(domain) ?? 1,
    domain,
    name: mention.name,
    mentionShare: computeRate(mention.count, totalResponses),
  }));

  if (!leaderboard.some(({ domain }) => domain === target.domain)) {
    const position = ranks.get(target.domain);
    if (position !== undefined) {
      leaderboard.push({
        position,
        domain: target.domain,
        name: target.name,
        mentionShare: computeRate(
          mentions.get(target.domain)?.count ?? 0,
          totalResponses,
        ),
      });
    }
  }

  return leaderboard;
}

function buildBrandVisibility(
  responses: EngineResult[],
  targetDomain: string,
): BrandVisibility {
  const engineRates = ENGINES.map((engine) => {
    const engineResponses = responses.filter(
      (response) => response.engine === engine,
    );
    const key = engine === "google-aio" ? "google_aio" : engine;

    return [
      key,
      computeDomainMetrics(targetDomain, visibilityResponses(engineResponses))
        .mentionRate,
    ] as const;
  });

  return {
    ...(Object.fromEntries(engineRates) as Omit<BrandVisibility, "overall">),
    overall: computeDomainMetrics(targetDomain, visibilityResponses(responses))
      .mentionRate,
  };
}

function trimSentiment(sentiment: SentimentResult): SentimentResult {
  const claims = [
    ...sentiment.claims
      .filter((claim) => claim.sentiment === "positive")
      .slice(0, 5),
    ...sentiment.claims
      .filter((claim) => claim.sentiment === "negative")
      .slice(0, 5),
  ];
  const responseIds = new Set(claims.map(({ responseId }) => responseId));

  return {
    ...sentiment,
    claims,
    responses: sentiment.responses.filter(({ id }) => responseIds.has(id)),
  };
}

export function buildAuditReport(result: AuditRunResult): AuditReport {
  const targetDomain = normalizedDomain(result.profile.domain);
  const totalResponses = result.engineResponses.length;

  return {
    topPages: buildTopPages(result.engineResponses, totalResponses),
    citationLeaderboard: buildCitationLeaderboard(
      result.engineResponses,
      totalResponses,
      targetDomain,
    ),
    visibilityLeaderboard: buildVisibilityLeaderboard(
      result.engineResponses,
      totalResponses,
      { domain: targetDomain, name: result.profile.name },
    ),
    sentiment: trimSentiment(result.sentimentResult),
    contentSuggestions: result.contentIdeas,
    brandVisibility: buildBrandVisibility(result.engineResponses, targetDomain),
    promptCoverage: buildPromptCoverage(
      result.prompts,
      result.engineResponses,
      targetDomain,
    ),
  };
}
