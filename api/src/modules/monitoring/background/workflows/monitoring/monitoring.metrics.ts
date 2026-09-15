// Computes mention rate / citation share / share-of-voice (SOV) per brand
// (our business + its competitors), both per-prompt (used for the prompt
// detail view) and per-business/engine (used for the dashboard trend).
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import {
  computeDomainMetrics,
  computeRate,
} from "@/common/visibility/visibility-metric-calculator";
import { AiEngine, MetricEngine, PromptAwarenessStage } from "@prisma/client";
import type {
  ComputedBusinessMetric,
  ComputedPromptMetric,
  MonitoringEngineResponse,
  MonitoringMetricResponse,
} from "./monitoring.types";

interface MonitoredBrand {
  brandId: string;
  kind: "BUSINESS" | "COMPETITOR";
  domain: string;
}

interface MetricContext {
  date: Date;
  brands: {
    id: string;
    kind: "BUSINESS" | "COMPETITOR";
    domain: string;
  }[];
}

interface PromptMetricContext extends MetricContext {
  businessId: string;
  prompts: {
    id: string;
  }[];
}

interface BusinessMetricContext extends MetricContext {
  businessId: string;
}

type MetricInputResponse = MonitoringMetricResponse | MonitoringEngineResponse;
type NormalizedMetricResponse = Omit<
  MonitoringMetricResponse,
  "awarenessStage"
> & {
  awarenessStage?: PromptAwarenessStage;
};
type MetricRow = Omit<ComputedPromptMetric, "businessId" | "promptId">;

const metricEngineByAiEngine: Record<AiEngine, MetricEngine> = {
  [AiEngine.CLAUDE]: MetricEngine.CLAUDE,
  [AiEngine.CHATGPT]: MetricEngine.CHATGPT,
  [AiEngine.PERPLEXITY]: MetricEngine.PERPLEXITY,
  [AiEngine.AI_OVERVIEWS]: MetricEngine.AI_OVERVIEWS,
};

function computeSentimentMetrics(
  responses: NormalizedMetricResponse[],
  brandDomain: string,
): Pick<
  MetricRow,
  "positiveClaimCount" | "negativeClaimCount" | "positiveSentimentShare"
> {
  // Claims are analysed one brand at a time, so a response's claims belong to
  // several brands and only this brand's count towards its row.
  const claims = responses
    .flatMap((response) => response.sentimentClaims)
    .filter(
      (claim) =>
        claim.brandDomain !== null &&
        normalizeBrandDomain(claim.brandDomain) === brandDomain,
    );
  const positiveClaimCount = claims.filter(
    (claim) => claim.sentiment === "POSITIVE",
  ).length;
  const negativeClaimCount = claims.filter(
    (claim) => claim.sentiment === "NEGATIVE",
  ).length;
  const totalClaimCount = positiveClaimCount + negativeClaimCount;

  return {
    positiveClaimCount,
    negativeClaimCount,
    positiveSentimentShare:
      totalClaimCount > 0
        ? computeRate(positiveClaimCount, totalClaimCount)
        : null,
  };
}

function normalizeBrandDomain(domain: string): string {
  return normalizeDomain(domain) ?? domain;
}

function buildMetricRow(
  brand: MonitoredBrand,
  responses: NormalizedMetricResponse[],
  date: Date,
  shareOfVoice: number,
): MetricRow {
  // computeDomainMetrics also derives its own sov (mentionRate x citationShare
  // formula), but the relative, mention-share-based value computed below by
  // buildCompetitiveSovByDomain is what's actually stored — so only mentionRate
  // and citationShare are taken from it.
  const { mentionRate, citationShare } = computeDomainMetrics(
    brand.domain,
    responses,
  );

  return {
    brandId: brand.brandId,
    date,
    mentionRate,
    citationShare,
    shareOfVoice,
    // Every tracked brand now gets its own sentiment, not just the business —
    // knowing how an answer describes a competitor is the actionable half.
    ...computeSentimentMetrics(responses, brand.domain),
  };
}

function buildCompetitiveSovByDomain(
  brands: MonitoredBrand[],
  responses: NormalizedMetricResponse[],
): Map<string, number> {
  const brandDomains = new Set(brands.map((brand) => brand.domain));
  const mentionCounts = new Map(brands.map((brand) => [brand.domain, 0]));

  for (const response of responses) {
    for (const mention of response.mentions) {
      const domain = normalizeBrandDomain(mention.domain);
      if (!brandDomains.has(domain)) {
        continue;
      }

      mentionCounts.set(domain, (mentionCounts.get(domain) ?? 0) + 1);
    }
  }

  const totalBrandMentions = [...mentionCounts.values()].reduce(
    (sum, count) => sum + count,
    0,
  );

  return new Map(
    brands.map((brand) => [
      brand.domain,
      computeRate(mentionCounts.get(brand.domain) ?? 0, totalBrandMentions),
    ]),
  );
}

function buildMetricRows(
  brands: MonitoredBrand[],
  responses: NormalizedMetricResponse[],
  date: Date,
): MetricRow[] {
  const competitiveSovByDomain = buildCompetitiveSovByDomain(brands, responses);

  return brands.map((brand) =>
    buildMetricRow(
      brand,
      responses,
      date,
      competitiveSovByDomain.get(brand.domain) ?? 0,
    ),
  );
}

function buildMonitoredBrands(context: MetricContext): MonitoredBrand[] {
  return context.brands.map((brand) => ({
    brandId: brand.id,
    kind: brand.kind,
    domain: normalizeBrandDomain(brand.domain),
  }));
}

function normalizeResponses(
  responses: MetricInputResponse[],
): NormalizedMetricResponse[] {
  return responses.map((response) => ({
    engine: response.engine,
    promptId: response.promptId,
    citations: response.citations,
    mentions: response.mentions,
    sentimentClaims: response.sentimentClaims,
    ...("awarenessStage" in response
      ? { awarenessStage: response.awarenessStage }
      : {}),
  }));
}

export function computePromptMetrics(
  context: PromptMetricContext,
  responses: MetricInputResponse[],
): ComputedPromptMetric[] {
  const date = context.date;
  const brands = buildMonitoredBrands(context);
  const normalizedResponses = normalizeResponses(responses);

  return context.prompts.flatMap((prompt) => {
    const promptResponses = normalizedResponses.filter(
      (response) => response.promptId === prompt.id,
    );
    if (promptResponses.length === 0) {
      return [];
    }

    return buildMetricRows(brands, promptResponses, date).map((metric) => ({
      businessId: context.businessId,
      promptId: prompt.id,
      ...metric,
    }));
  });
}

export function computeBusinessMetrics(
  context: BusinessMetricContext,
  responses: MonitoringMetricResponse[],
): ComputedBusinessMetric[] {
  const date = context.date;
  const brands = buildMonitoredBrands(context);
  const visibilityResponses = responses.filter(
    (response) => response.awarenessStage !== PromptAwarenessStage.DECIDE,
  );
  const engines = Array.from(
    new Set(visibilityResponses.map((response) => response.engine)),
  );

  const engineMetrics = engines.flatMap((engine) => {
    const engineResponses = visibilityResponses.filter(
      (response) => response.engine === engine,
    );

    return buildMetricRows(brands, engineResponses, date).map((metric) => ({
      businessId: context.businessId,
      engine: metricEngineByAiEngine[engine],
      ...metric,
    }));
  });

  const aggregateMetrics = buildMetricRows(
    brands,
    visibilityResponses,
    date,
  ).map((metric) => ({
    businessId: context.businessId,
    engine: MetricEngine.ALL,
    ...metric,
  }));

  return [...aggregateMetrics, ...engineMetrics];
}
