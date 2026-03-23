import { RunnableConfig } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
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
import { normalizeDomain } from "../utils/normalize-domain";

export async function buildReport(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");

  const logger = configurable?.logger as Logger;
  logger?.debug(`[build-report] Building report for audit ${state._auditId}`);

  const allSources = state._engineResults.flatMap((r) => r.sources);
  const totalSourceAppearances = allSources.length;
  const targetDomain = state._domain;

  // --- Top 3 cited pages ---
  const pageMap = new Map<string, { count: number; title: string }>();
  for (const src of allSources) {
    const entry = pageMap.get(src.url);
    if (entry) {
      entry.count++;
    } else {
      pageMap.set(src.url, { count: 1, title: src.title });
    }
  }

  const topPages: CitedPage[] = [...pageMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([url, { count, title }], i) => ({
      position: i + 1,
      url,
      title,
      description: "",
      domain: normalizeDomain(url) ?? url,
      citationShare: totalSourceAppearances > 0 ? (count / totalSourceAppearances) * 100 : 0,
    }));

  if (topPages[0]) {
    logger?.debug(`[build-report] Top page: ${topPages[0].url} (${topPages[0].citationShare.toFixed(1)}%)`);
  }

  // --- Top 6 cited domains ---
  const domainMap = new Map<string, number>();
  for (const src of allSources) {
    const d = normalizeDomain(src.url) ?? src.url;
    domainMap.set(d, (domainMap.get(d) ?? 0) + 1);
  }

  const sortedDomains = [...domainMap.entries()].sort((a, b) => b[1] - a[1]);

  const domainRanks = new Map<string, number>();
  sortedDomains.forEach(([d], i) => domainRanks.set(d, i + 1));

  const topCitedDomains: CitedDomain[] = sortedDomains.slice(0, 6).map(([domain, count]) => ({
    position: domainRanks.get(domain)!,
    domain,
    citationShare: totalSourceAppearances > 0 ? (count / totalSourceAppearances) * 100 : 0,
  }));

  const targetInCitedTop6 = topCitedDomains.some((d) => d.domain === targetDomain);
  if (!targetInCitedTop6) {
    const targetCitedRank = domainRanks.get(targetDomain);
    if (targetCitedRank !== undefined) {
      const targetCount = domainMap.get(targetDomain)!;
      topCitedDomains.push({
        position: targetCitedRank,
        domain: targetDomain,
        citationShare: totalSourceAppearances > 0 ? (targetCount / totalSourceAppearances) * 100 : 0,
      });
    }
  }

  if (topCitedDomains[0]) {
    logger?.debug(`[build-report] Top cited domain: ${topCitedDomains[0].domain} (${topCitedDomains[0].citationShare.toFixed(1)}%)`);
  }

  // --- Top 6 mentioned brands ---
  const allMentions = state._engineResults.flatMap((r) => r.mentions).filter((m) => !!m.domain);
  const totalMentionEvents = allMentions.length;

  const brandMap = new Map<string, { count: number; name: string | null }>();
  for (const m of allMentions) {
    const key = normalizeDomain(m.domain!) ?? m.domain!;
    const entry = brandMap.get(key);
    if (entry) {
      entry.count++;
    } else {
      brandMap.set(key, { count: 1, name: m.name });
    }
  }

  const sortedBrands = [...brandMap.entries()].sort((a, b) => b[1].count - a[1].count);

  const brandRanks = new Map<string, number>();
  sortedBrands.forEach(([d], i) => brandRanks.set(d, i + 1));

  const topMentionedBrands: MentionedBrand[] = sortedBrands.slice(0, 6).map(([domain, { count, name }]) => ({
    position: brandRanks.get(domain)!,
    domain,
    name,
    mentionShare: totalMentionEvents > 0 ? (count / totalMentionEvents) * 100 : 0,
  }));

  const targetInBrandsTop6 = topMentionedBrands.some((b) => b.domain === targetDomain);
  if (!targetInBrandsTop6) {
    const targetBrandRank = brandRanks.get(targetDomain);
    if (targetBrandRank !== undefined) {
      const targetBrandEntry = brandMap.get(targetDomain)!;
      topMentionedBrands.push({
        position: targetBrandRank,
        domain: targetDomain,
        name: state._brandName,
        mentionShare: totalMentionEvents > 0 ? (targetBrandEntry.count / totalMentionEvents) * 100 : 0,
      });
    }
  }

  if (topMentionedBrands[0]) {
    logger?.debug(`[build-report] Top mentioned brand: ${topMentionedBrands[0].domain} (${topMentionedBrands[0].mentionShare.toFixed(1)}%)`);
  }

  const validTopPages = z.array(CitedPageSchema).parse(topPages);
  const validCitedDomains = z.array(CitedDomainSchema).parse(topCitedDomains);
  const validMentionedBrands = z.array(MentionedBrandSchema).parse(topMentionedBrands);
  const validContentSuggestions = state._contentIdeas ? z.array(ContentIdeaSchema).parse(state._contentIdeas) : null;

  // --- Trim sentiment to 5 random positive + 5 random negative claims ---
  let validSentiment: z.infer<typeof SentimentResultSchema> | null = null;
  if (state._sentimentResult) {
    const shuffle = <T>(arr: T[]) => arr.slice().sort(() => Math.random() - 0.5);
    const positiveClaims = shuffle(state._sentimentResult.claims.filter((c) => c.sentiment === "positive")).slice(0, 5);
    const negativeClaims = shuffle(state._sentimentResult.claims.filter((c) => c.sentiment === "negative")).slice(0, 5);
    const selectedClaims = [...positiveClaims, ...negativeClaims];

    const usedResponseIds = new Set(selectedClaims.map((c) => c.responseId));
    const filteredResponses = state._sentimentResult.responses.filter((r) => usedResponseIds.has(r.id));

    validSentiment = SentimentResultSchema.parse({
      ...state._sentimentResult,
      claims: selectedClaims,
      responses: filteredResponses,
    });

    logger?.debug(`[build-report] Sentiment: ${positiveClaims.length} positive, ${negativeClaims.length} negative claims, ${filteredResponses.length} responses`);
  }

  await prisma.audit.update({
    where: { id: state._auditId },
    data: {
      brandName: state._brandName,
      visibilityLeaderboard: validMentionedBrands as unknown as Prisma.InputJsonValue,
      citationLeaderboard: validCitedDomains as unknown as Prisma.InputJsonValue,
      sentiment: validSentiment as unknown as Prisma.InputJsonValue,
      topPages: validTopPages as unknown as Prisma.InputJsonValue,
      contentSuggestions: validContentSuggestions as unknown as Prisma.InputJsonValue,
    },
  });

  logger?.debug(`[build-report] Persisted report for audit ${state._auditId}`);
  return {};
}
