import { AiEngine, PromptAwarenessStage } from "@prisma/client";

export const MONITORING_ENGINES = [
  "google-aio",
  "perplexity",
  "claude",
  "chatgpt",
] as const;

export type MonitoringEngine = (typeof MONITORING_ENGINES)[number];

export type MonitoringPrompt = {
  id: string;
  text: string;
};

export type MonitoringCompetitor = {
  id: string;
  domain: string;
  name: string;
};

export type MonitoringProfile = {
  name: string;
  category: string;
  description: string;
  icp: string;
  domain: string;
};

export type Citation = {
  url: string;
  title: string;
  excerpt: string;
};

export type Mention = {
  domain: string;
};

export type FanOutQuery = {
  query: string;
  inferred: boolean;
};

export type EngineResponse = {
  responseKey: string;
  engine: MonitoringEngine;
  promptId: string;
  sampleNumber: number;
  content: string;
  citations: Citation[];
  mentions: Mention[];
  fanOutQueries: FanOutQuery[];
  raw: unknown;
};

export type EngineFailure = {
  engine: MonitoringEngine;
  promptId: string;
  sampleNumber: number;
  error: string;
  raw?: unknown;
};

export type ResponseMentions = {
  responseKey: string;
  mentions: Mention[];
};

export type ResponseFanOutInference = {
  responseKey: string;
  queries: string[];
};

export type EngineExecutionResult = {
  rawEngineResponses: EngineResponse[];
  engineFailures: EngineFailure[];
};

export type PromptMetricState = {
  promptId: string;
  competitorId: string | null;
  date: Date;
  mentionRate: number;
  citationShare: number;
  sov: number;
};

export type BusinessMetricState = {
  businessId: string;
  competitorId: string | null;
  engine: AiEngine | null;
  date: Date;
  mentionRate: number;
  citationShare: number;
  sov: number;
};

export type MetricResponse = {
  engine: AiEngine;
  promptId: string;
  citations: Pick<Citation, "url" | "title">[];
  mentions: Mention[];
  awarenessStage: PromptAwarenessStage;
};
