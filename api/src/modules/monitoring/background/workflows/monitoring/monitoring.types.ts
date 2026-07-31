import type { AiEngine, PromptAwarenessStage } from "@prisma/client";

export interface MonitoringCitation {
  url: string;
  title: string;
  excerpt: string;
}

export interface MonitoringMention {
  domain: string;
}

export interface MonitoringFanOutQuery {
  query: string;
  inferred: boolean;
}

export interface MonitoringEngineResponse {
  responseKey: string;
  engine: AiEngine;
  promptId: string;
  content: string;
  citations: MonitoringCitation[];
  inferenceSources: MonitoringCitation[];
  mentions: MonitoringMention[];
  fanOutQueries: MonitoringFanOutQuery[];
}

export interface MonitoringEngineFailure {
  engine: AiEngine;
  promptId: string;
  errorMessage: string;
}

export interface MonitoringPrompt {
  id: string;
  text: string;
}

export interface MonitoringCompetitor {
  id: string;
  domain: string;
  name: string;
}

export interface MonitoringRunInput {
  businessId: string;
  prompts: MonitoringPrompt[];
  competitors: MonitoringCompetitor[];
  profile: { name: string; domain: string };
  date: Date;
}

export interface ComputedPromptMetric {
  promptId: string;
  competitorId: string | null;
  date: Date;
  mentionRate: number;
  citationShare: number;
  sov: number;
}

export interface ComputedBusinessMetric {
  businessId: string;
  competitorId: string | null;
  engine: AiEngine | null;
  date: Date;
  mentionRate: number;
  citationShare: number;
  sov: number;
}

export interface MonitoringRunResult extends MonitoringRunInput {
  engineResponses: MonitoringEngineResponse[];
  engineFailures: MonitoringEngineFailure[];
  promptMetrics: ComputedPromptMetric[];
}

export interface MonitoringMetricResponse {
  engine: AiEngine;
  promptId: string;
  citations: Pick<MonitoringCitation, "url" | "title">[];
  mentions: MonitoringMention[];
  awarenessStage: PromptAwarenessStage;
}
