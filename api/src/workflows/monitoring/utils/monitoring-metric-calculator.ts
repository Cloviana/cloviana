import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import {
  computeDomainMetrics,
  computeRate,
} from "@/common/visibility/visibility-metric-calculator";
import { AiEngine, PromptAwarenessStage } from "@prisma/client";
import type {
  BusinessMetricState,
  EngineResponse,
  MetricResponse,
  PromptMetricState,
} from "../monitoring.types";

type Brand = {
  competitorId: string | null;
  domain: string;
};

type MetricContext = {
  date: Date;
  profile: {
    domain: string;
  };
  competitors: {
    id: string;
    domain: string;
  }[];
};

type PromptMetricContext = MetricContext & {
  prompts: {
    id: string;
  }[];
};

type BusinessMetricContext = MetricContext & {
  businessId: string;
};

type MetricInputResponse = MetricResponse | EngineResponse;
type MetricRow = Omit<PromptMetricState, "promptId">;

function normalizeBrandDomain(domain: string): string {
  return normalizeDomain(domain) ?? domain;
}

function buildMetricRow(
  brand: Brand,
  responses: MetricResponse[],
  date: Date,
  sov: number,
): MetricRow {
  return {
    competitorId: brand.competitorId,
    date,
    ...computeDomainMetrics(brand.domain, responses),
    sov,
  };
}

function buildCompetitiveSovByDomain(
  brands: Brand[],
  responses: MetricResponse[],
): Map<string, number> {
  const brandDomains = new Set(brands.map((brand) => brand.domain));
  const mentionCounts = new Map(brands.map((brand) => [brand.domain, 0]));

  for (const response of responses) {
    for (const mention of response.mentions) {
      const domain = normalizeBrandDomain(mention.domain);
      if (!brandDomains.has(domain)) continue;

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
  brands: Brand[],
  responses: MetricResponse[],
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

function buildBrands(context: MetricContext): Brand[] {
  return [
    {
      competitorId: null,
      domain: normalizeBrandDomain(context.profile.domain),
    },
    ...context.competitors.map((competitor) => ({
      competitorId: competitor.id,
      domain: normalizeBrandDomain(competitor.domain),
    })),
  ];
}

function normalizeEngine(
  engine: MetricResponse["engine"] | EngineResponse["engine"],
): AiEngine {
  switch (engine) {
    case AiEngine.AI_OVERVIEWS:
    case AiEngine.PERPLEXITY:
    case AiEngine.CLAUDE:
    case AiEngine.CHATGPT:
      return engine;
    case "google-aio":
      return AiEngine.AI_OVERVIEWS;
    case "perplexity":
      return AiEngine.PERPLEXITY;
    case "claude":
      return AiEngine.CLAUDE;
    case "chatgpt":
      return AiEngine.CHATGPT;
  }
}

function normalizeResponses(
  responses: MetricInputResponse[],
): MetricResponse[] {
  return responses.map((response) => ({
    engine: normalizeEngine(response.engine),
    promptId: response.promptId,
    citations: response.citations,
    mentions: response.mentions,
    awarenessStage: (response as MetricResponse).awarenessStage,
  }));
}

export function computePromptMetrics(
  context: PromptMetricContext,
  responses: MetricInputResponse[],
): PromptMetricState[] {
  const date = context.date;
  const brands = buildBrands(context);
  const normalizedResponses = normalizeResponses(responses);

  return context.prompts.flatMap((prompt) => {
    const promptResponses = normalizedResponses.filter(
      (response) => response.promptId === prompt.id,
    );

    return buildMetricRows(brands, promptResponses, date).map((metric) => ({
      promptId: prompt.id,
      ...metric,
    }));
  });
}

export function computeBusinessMetrics(
  context: BusinessMetricContext,
  responses: MetricResponse[],
): BusinessMetricState[] {
  const date = context.date;
  const brands = buildBrands(context);
  const visibilityResponses = responses.filter(
    (r) => r.awarenessStage !== PromptAwarenessStage.DECIDE,
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
      engine,
      ...metric,
    }));
  });

  const aggregateMetrics = buildMetricRows(
    brands,
    visibilityResponses,
    date,
  ).map((metric) => ({
    businessId: context.businessId,
    engine: null,
    ...metric,
  }));

  return [...aggregateMetrics, ...engineMetrics];
}
