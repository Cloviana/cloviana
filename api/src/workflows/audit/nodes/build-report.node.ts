import { ResendService } from "@/clients/resend/resend.service";
import { RunnableConfig } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
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
import { EngineResult, EngineSource } from "../audit.types";
import { StateAnnotation } from "../audit.state";
import { normalizeDomain } from "../utils/normalize-domain";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const citationShare = (count: number, total: number) =>
  total > 0 ? (count / total) * 100 : 0;

async function fetchMetaDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    const match = html.match(/<meta\s+(?:[^>]*?\s+)?name=["']description["']\s+content=["']([^"']+)["']/i)
      ?? html.match(/<meta\s+(?:[^>]*?\s+)?content=["']([^"']+)["']\s+name=["']description["']/i);
    return match?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}

const shuffle = <T>(arr: T[]) => arr.slice().sort(() => Math.random() - 0.5);

// ─── Aggregations ─────────────────────────────────────────────────────────────

function buildTopPages(allSources: EngineSource[], total: number): CitedPage[] {
  const map = new Map<string, { count: number; title: string; description: string }>();

  for (const src of allSources) {
    const entry = map.get(src.url);
    if (entry) {
      entry.count++;
      if (!entry.description && src.description) entry.description = src.description;
    } else {
      map.set(src.url, { count: 1, title: src.title, description: src.description });
    }
  }

  return [...map.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([url, { count, title, description }], i) => ({
      position: i + 1,
      url,
      title,
      description: description || "Click this preview to learn more",
      domain: normalizeDomain(url) ?? url,
      citationShare: citationShare(count, total),
    }));
}

function buildCitationLeaderboard(allSources: EngineSource[], total: number, targetDomain: string): CitedDomain[] {
  const map = new Map<string, number>();
  for (const src of allSources) {
    const d = normalizeDomain(src.url) ?? src.url;
    map.set(d, (map.get(d) ?? 0) + 1);
  }

  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const ranks = new Map(sorted.map(([d], i) => [d, i + 1]));

  const top6: CitedDomain[] = sorted.slice(0, 6).map(([domain, count]) => ({
    position: ranks.get(domain)!,
    domain,
    citationShare: citationShare(count, total),
  }));

  if (!top6.some((d) => d.domain === targetDomain)) {
    const rank = ranks.get(targetDomain);
    if (rank !== undefined) {
      top6.push({ position: rank, domain: targetDomain, citationShare: citationShare(map.get(targetDomain)!, total) });
    }
  }

  return top6;
}

function buildVisibilityLeaderboard(
  engineResults: EngineResult[],
  totalRuns: number,
  targetDomain: string,
  brandName: string,
): MentionedBrand[] {
  // Binary per run: brand found in a run = 1, regardless of how many times mentioned
  const map = new Map<string, { count: number; name: string | null }>();

  for (const r of engineResults) {
    const seen = new Set<string>();
    for (const m of r.mentions.filter((m) => !!m.domain)) {
      const key = normalizeDomain(m.domain!) ?? m.domain!;
      if (!seen.has(key)) {
        seen.add(key);
        const entry = map.get(key);
        entry ? entry.count++ : map.set(key, { count: 1, name: m.name });
      }
    }
  }

  const sorted = [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  const ranks = new Map(sorted.map(([d], i) => [d, i + 1]));

  const top6: MentionedBrand[] = sorted.slice(0, 6).map(([domain, { count, name }]) => ({
    position: ranks.get(domain)!,
    domain,
    name,
    mentionShare: citationShare(count, totalRuns),
  }));

  if (!top6.some((b) => b.domain === targetDomain)) {
    const rank = ranks.get(targetDomain);
    if (rank !== undefined) {
      top6.push({
        position: rank,
        domain: targetDomain,
        name: brandName,
        mentionShare: citationShare(map.get(targetDomain)!.count, totalRuns),
      });
    }
  }

  return top6;
}

function buildBrandVisibility(engineResults: EngineResult[], targetDomain: string) {
  const engines = ["google_aio", "chatgpt", "perplexity"] as const;
  const perEngine = Object.fromEntries(
    engines.map((engine) => {
      const rows = engineResults.filter((r) => r.engine === engine);
      const mentioned = rows.filter((r) =>
        r.mentions.some((m) => (normalizeDomain(m.domain ?? "") ?? m.domain) === targetDomain),
      ).length;
      return [engine, rows.length > 0 ? Math.round((mentioned / rows.length) * 100) : 0];
    }),
  ) as Record<typeof engines[number], number>;

  const totalRows = engineResults.length;
  const totalMentioned = engineResults.filter((r) =>
    r.mentions.some((m) => (normalizeDomain(m.domain ?? "") ?? m.domain) === targetDomain),
  ).length;

  return { ...perEngine, overall: totalRows > 0 ? Math.round((totalMentioned / totalRows) * 100) : 0 };
}

function trimSentiment(raw: typeof StateAnnotation.State._sentimentResult) {
  if (!raw) return null;

  const positiveClaims = shuffle(raw.claims.filter((c) => c.sentiment === "positive")).slice(0, 5);
  const negativeClaims = shuffle(raw.claims.filter((c) => c.sentiment === "negative")).slice(0, 5);
  const selectedClaims = [...positiveClaims, ...negativeClaims];

  const usedIds = new Set(selectedClaims.map((c) => c.responseId));

  return SentimentResultSchema.parse({
    ...raw,
    claims: selectedClaims,
    responses: raw.responses.filter((r) => usedIds.has(r.id)),
  });
}

// ─── Node ────────────────────────────────────────────────────────────────────

export async function buildReport(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");

  const logger = configurable?.logger as Logger;
  logger?.debug(`[build-report] Building report for audit ${state._auditId}`);

  const allSources = state._engineResults.flatMap((r) => r.sources);
  const totalSources = allSources.length;
  const totalRuns = state._engineResults.length;

  const rawTopPages = buildTopPages(allSources, totalSources);
  await Promise.all(
    rawTopPages
      .filter((p) => !p.description || p.description === "Click this preview to learn more")
      .map(async (p) => {
        const desc = await fetchMetaDescription(p.url);
        p.description = desc || "Click this preview to learn more";
      }),
  );
  const topPages = z.array(CitedPageSchema).parse(rawTopPages);
  const citationLeaderboard  = z.array(CitedDomainSchema).parse(buildCitationLeaderboard(allSources, totalSources, state._domain));
  const visibilityLeaderboard = z.array(MentionedBrandSchema).parse(buildVisibilityLeaderboard(state._engineResults, totalRuns, state._domain, state._brandName));
  const sentiment            = trimSentiment(state._sentimentResult);
  const contentSuggestions   = state._contentIdeas ? z.array(ContentIdeaSchema).parse(state._contentIdeas) : null;
  const brandVisibility      = BrandVisibilitySchema.parse(buildBrandVisibility(state._engineResults, state._domain));

  logger?.debug(`[build-report] Top page: ${topPages[0]?.url} (${topPages[0]?.citationShare.toFixed(1)}%)`);
  logger?.debug(`[build-report] Top cited domain: ${citationLeaderboard[0]?.domain} (${citationLeaderboard[0]?.citationShare.toFixed(1)}%)`);
  logger?.debug(`[build-report] Top mentioned brand: ${visibilityLeaderboard[0]?.domain} (${visibilityLeaderboard[0]?.mentionShare.toFixed(1)}%)`);
  if (sentiment) logger?.debug(`[build-report] Sentiment: ${sentiment.claims.filter((c) => c.sentiment === "positive").length} positive, ${sentiment.claims.filter((c) => c.sentiment === "negative").length} negative`);

  await prisma.audit.update({
    where: { id: state._auditId },
    data: {
      brandName: state._brandName,
      visibilityLeaderboard: visibilityLeaderboard as unknown as Prisma.InputJsonValue,
      citationLeaderboard: citationLeaderboard as unknown as Prisma.InputJsonValue,
      sentiment: sentiment as unknown as Prisma.InputJsonValue,
      topPages: topPages as unknown as Prisma.InputJsonValue,
      contentSuggestions: contentSuggestions as unknown as Prisma.InputJsonValue,
      brandVisibility: brandVisibility as unknown as Prisma.InputJsonValue,
    },
  });

  logger?.debug(`[build-report] Persisted report for audit ${state._auditId}`);

  const resend = configurable?.resend as ResendService;
  if (resend) {
    try {
      await resend.sendAuditComplete(state._email, state._auditId, state._brandName);
      logger?.debug(`[build-report] Sent completion email to ${state._email}`);
    } catch (err) {
      logger?.error(`[build-report] Failed to send completion email to ${state._email}: ${err}`);
    }
  }

  return {};
}