import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import {
  computeDomainMetrics,
  computeRate,
} from "@/common/visibility/visibility-metric-calculator";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AuditNodeConfig, requireAuditDependencies } from "../audit.config";
import {
  BrandVisibilitySchema,
  CitedDomain,
  CitedDomainSchema,
  CitedPage,
  CitedPageSchema,
  ContentIdeaSchema,
  MentionedBrand,
  MentionedBrandSchema,
  SentimentResultSchema,
} from "../audit.schemas";
import { StateAnnotation } from "../audit.state";
import { EngineResult } from "../audit.types";

type Brand = {
  domain: string;
  name: string | null;
};

const ENGINE_KEYS = ["google-aio", "chatgpt", "perplexity"] as const;

async function fetchMetaDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    const match =
      html.match(
        /<meta\s+(?:[^>]*?\s+)?name=["']description["']\s+content=["']([^"']+)["']/i,
      ) ??
      html.match(
        /<meta\s+(?:[^>]*?\s+)?content=["']([^"']+)["']\s+name=["']description["']/i,
      );
    return match?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}

const shuffle = <T>(arr: T[]) => arr.slice().sort(() => Math.random() - 0.5);

function normalizeBrandDomain(domain: string): string {
  return normalizeDomain(domain) ?? domain;
}

function toVisibilityResponses(engineResponses: EngineResult[]) {
  return engineResponses.map((response) => ({
    citations: response.sources.map((source) => ({ url: source.url })),
    mentions: response.mentions.map((mention) => ({
      domain: mention.domain,
    })),
  }));
}

function buildTopPages(
  engineResponses: EngineResult[],
  totalResponses: number,
): CitedPage[] {
  const map = new Map<
    string,
    { count: number; title: string; description: string }
  >();

  for (const response of engineResponses) {
    const seen = new Set<string>();

    for (const source of response.sources) {
      if (seen.has(source.url)) continue;
      seen.add(source.url);

      const entry = map.get(source.url);
      if (entry) {
        entry.count += 1;
        if (!entry.description && source.description) {
          entry.description = source.description;
        }
      } else {
        map.set(source.url, {
          count: 1,
          title: source.title,
          description: source.description,
        });
      }
    }
  }

  return [...map.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([url, { count, title, description }], index) => ({
      position: index + 1,
      url,
      title,
      description: description || "Click this preview to learn more",
      domain: normalizeBrandDomain(url),
      citationShare: computeRate(count, totalResponses),
    }));
}

function buildCitationLeaderboard(
  engineResponses: EngineResult[],
  totalResponses: number,
  targetDomain: string,
): CitedDomain[] {
  const map = new Map<string, number>();

  for (const response of engineResponses) {
    const seen = new Set<string>();

    for (const source of response.sources) {
      const domain = normalizeBrandDomain(source.url);
      if (seen.has(domain)) continue;
      seen.add(domain);
      map.set(domain, (map.get(domain) ?? 0) + 1);
    }
  }

  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const ranks = new Map(sorted.map(([domain], index) => [domain, index + 1]));
  const leaderboard = sorted.slice(0, 6).map(([domain, count]) => ({
    position: ranks.get(domain) ?? 1,
    domain,
    citationShare: computeRate(count, totalResponses),
  }));

  if (!leaderboard.some((item) => item.domain === targetDomain)) {
    const rank = ranks.get(targetDomain);
    const targetCount = map.get(targetDomain);

    if (rank !== undefined) {
      leaderboard.push({
        position: rank,
        domain: targetDomain,
        citationShare: computeRate(targetCount ?? 0, totalResponses),
      });
    }
  }

  return leaderboard;
}

function buildVisibilityLeaderboard(
  engineResponses: EngineResult[],
  totalResponses: number,
  targetBrand: Brand,
): MentionedBrand[] {
  const map = new Map<string, { count: number; name: string | null }>();

  for (const response of engineResponses) {
    const seen = new Set<string>();

    for (const mention of response.mentions) {
      if (!mention.domain) continue;

      const domain = normalizeBrandDomain(mention.domain);
      if (seen.has(domain)) continue;
      seen.add(domain);

      const entry = map.get(domain);
      if (entry) {
        entry.count += 1;
      } else {
        map.set(domain, { count: 1, name: mention.name });
      }
    }
  }

  const sorted = [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  const ranks = new Map(sorted.map(([domain], index) => [domain, index + 1]));
  const leaderboard = sorted.slice(0, 6).map(([domain, { count, name }]) => ({
    position: ranks.get(domain) ?? 1,
    domain,
    name,
    mentionShare: computeRate(count, totalResponses),
  }));

  if (!leaderboard.some((item) => item.domain === targetBrand.domain)) {
    const rank = ranks.get(targetBrand.domain);
    const targetEntry = map.get(targetBrand.domain);

    if (rank !== undefined) {
      leaderboard.push({
        position: rank,
        domain: targetBrand.domain,
        name: targetBrand.name,
        mentionShare: computeRate(targetEntry?.count ?? 0, totalResponses),
      });
    }
  }

  return leaderboard;
}

function buildBrandVisibility(
  engineResponses: EngineResult[],
  targetDomain: string,
) {
  const entries = ENGINE_KEYS.map((engine) => {
    const responses = engineResponses.filter(
      (response) => response.engine === engine,
    );
    const metrics = computeDomainMetrics(
      targetDomain,
      toVisibilityResponses(responses),
    );

    return [
      engine === "google-aio" ? "google_aio" : engine,
      metrics.mentionRate,
    ];
  });
  const overallMetrics = computeDomainMetrics(
    targetDomain,
    toVisibilityResponses(engineResponses),
  );

  return {
    ...Object.fromEntries(entries),
    overall: overallMetrics.mentionRate,
  };
}

function trimSentiment(raw: typeof StateAnnotation.State.sentimentResult) {
  if (!raw) return null;

  const positiveClaims = shuffle(
    raw.claims.filter((claim) => claim.sentiment === "positive"),
  ).slice(0, 5);
  const negativeClaims = shuffle(
    raw.claims.filter((claim) => claim.sentiment === "negative"),
  ).slice(0, 5);
  const claims = [...positiveClaims, ...negativeClaims];
  const usedIds = new Set(claims.map((claim) => claim.responseId));

  return SentimentResultSchema.parse({
    ...raw,
    claims,
    responses: raw.responses.filter((response) => usedIds.has(response.id)),
  });
}

export async function buildReport(
  state: typeof StateAnnotation.State,
  config: AuditNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { prisma, resend, logger } = requireAuditDependencies(config);
  const targetDomain = normalizeBrandDomain(state.profile.domain);
  const totalResponses = state.engineResponses.length;
  const targetBrand = { domain: targetDomain, name: state.profile.name };
  const rawTopPages = buildTopPages(state.engineResponses, totalResponses);

  await Promise.all(
    rawTopPages
      .filter(
        (page) =>
          !page.description ||
          page.description === "Click this preview to learn more",
      )
      .map(async (page) => {
        const description = await fetchMetaDescription(page.url);
        page.description = description || "Click this preview to learn more";
      }),
  );

  const topPages = z.array(CitedPageSchema).parse(rawTopPages);
  const citationLeaderboard = z
    .array(CitedDomainSchema)
    .parse(
      buildCitationLeaderboard(
        state.engineResponses,
        totalResponses,
        targetDomain,
      ),
    );
  const visibilityLeaderboard = z
    .array(MentionedBrandSchema)
    .parse(
      buildVisibilityLeaderboard(
        state.engineResponses,
        totalResponses,
        targetBrand,
      ),
    );
  const sentiment = trimSentiment(state.sentimentResult);
  const contentSuggestions = state.contentIdeas
    ? z.array(ContentIdeaSchema).parse(state.contentIdeas)
    : null;
  const brandVisibility = BrandVisibilitySchema.parse(
    buildBrandVisibility(state.engineResponses, targetDomain),
  );

  await prisma.audit.update({
    where: { id: state.auditId },
    data: {
      brandName: state.profile.name,
      visibilityLeaderboard:
        visibilityLeaderboard as unknown as Prisma.InputJsonValue,
      citationLeaderboard:
        citationLeaderboard as unknown as Prisma.InputJsonValue,
      sentiment: sentiment as unknown as Prisma.InputJsonValue,
      topPages: topPages as unknown as Prisma.InputJsonValue,
      contentSuggestions:
        contentSuggestions as unknown as Prisma.InputJsonValue,
      brandVisibility: brandVisibility as unknown as Prisma.InputJsonValue,
    },
  });

  try {
    await resend.sendAuditComplete(
      state.email,
      state.auditId,
      state.profile.name,
    );
  } catch (error) {
    logger?.error(
      `Failed to send audit completion email auditId=${state.auditId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return {};
}
