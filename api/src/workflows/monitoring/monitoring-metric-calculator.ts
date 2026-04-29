import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { computeDomainMetrics } from "@/common/visibility/visibility-metric-calculator";
import { AiEngine } from "@prisma/client";
import type { StateType } from "./monitoring.state";
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

function buildBrands(
  state: Pick<StateType, "profile" | "competitors">,
): Brand[] {
  return [
    {
      competitorId: null,
      domain: normalizeBrandDomain(state.profile.domain),
    },
    ...state.competitors.map((competitor) => ({
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
  responses: Array<MetricResponse | StateType["engineResponses"][number]>,
): MetricResponse[] {
  return responses.map((response) => ({
    engine: normalizeEngine(response.engine),
    promptId: response.promptId,
    citations: response.citations,
    mentions: response.mentions,
  }));
}

export function computePromptMetrics(
  state: Pick<StateType, "date" | "profile" | "competitors" | "prompts">,
  responses: Array<MetricResponse | StateType["engineResponses"][number]>,
): PromptMetricState[] {
  const date = state.date;
  const brands = buildBrands(state);
  const normalizedResponses = normalizeResponses(responses);

  return state.prompts.flatMap((prompt) => {
    const promptResponses = normalizedResponses.filter(
      (response) => response.promptId === prompt.promptId,
    );

    return brands.map((brand) => ({
      promptId: prompt.promptId,
      ...buildMetricRow(brand, promptResponses, date),
    }));
  });
}

export function computeBusinessMetrics(
  state: Pick<StateType, "date" | "profile" | "competitors">,
  responses: Array<MetricResponse | StateType["engineResponses"][number]>,
): BusinessMetricState[] {
  const date = state.date;
  const brands = buildBrands(state);
  const normalizedResponses = normalizeResponses(responses);
  const engines = Array.from(
    new Set(normalizedResponses.map((response) => response.engine)),
  );

  const aggregateMetrics = brands.map((brand) => ({
    businessId: state.profile.businessId,
    engine: null,
    ...buildMetricRow(brand, normalizedResponses, date),
  }));

  const engineMetrics = engines.flatMap((engine) => {
    const engineResponses = normalizedResponses.filter(
      (response) => response.engine === engine,
    );

    return brands.map((brand) => ({
      businessId: state.profile.businessId,
      engine,
      ...buildMetricRow(brand, engineResponses, date),
    }));
  });

  return [...aggregateMetrics, ...engineMetrics];
}
