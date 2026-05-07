import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { computeDomainMetrics } from "@/common/visibility/visibility-metric-calculator";
import { AiEngine } from "@prisma/client";
import type {
  BusinessMetricState,
  EngineResponse,
  MetricResponse,
  PromptMetricState,
} from "./monitoring.types";

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

function normalizeBrandDomain(domain: string): string {
  return normalizeDomain(domain) ?? domain;
}

function buildMetricRow(
  brand: Brand,
  responses: MetricResponse[],
  date: Date,
): Omit<PromptMetricState, "promptId"> {
  return {
    competitorId: brand.competitorId,
    date,
    ...computeDomainMetrics(brand.domain, responses),
  };
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

function normalizeResponses(responses: MetricInputResponse[]): MetricResponse[] {
  return responses.map((response) => ({
    engine: normalizeEngine(response.engine),
    promptId: response.promptId,
    citations: response.citations,
    mentions: response.mentions,
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

    return brands.map((brand) => ({
      promptId: prompt.id,
      ...buildMetricRow(brand, promptResponses, date),
    }));
  });
}

export function computeBusinessMetrics(
  context: BusinessMetricContext,
  responses: MetricInputResponse[],
): BusinessMetricState[] {
  const date = context.date;
  const brands = buildBrands(context);
  const normalizedResponses = normalizeResponses(responses);
  const engines = Array.from(
    new Set(normalizedResponses.map((response) => response.engine)),
  );

  const aggregateMetrics = brands.map((brand) => ({
    businessId: context.businessId,
    engine: null,
    ...buildMetricRow(brand, normalizedResponses, date),
  }));

  const engineMetrics = engines.flatMap((engine) => {
    const engineResponses = normalizedResponses.filter(
      (response) => response.engine === engine,
    );

    return brands.map((brand) => ({
      businessId: context.businessId,
      engine,
      ...buildMetricRow(brand, engineResponses, date),
    }));
  });

  return [...aggregateMetrics, ...engineMetrics];
}
