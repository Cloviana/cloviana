import { AiEngine, PromptAwarenessStage } from "@prisma/client";

export type Citation = {
  url: string;
  title: string;
};

export type Mention = {
  domain: string;
};

export type EngineResponse = {
  engine: "google-aio" | "perplexity" | "claude" | "chatgpt";
  promptId: string;
  content: string;
  citations: Citation[];
  mentions: Mention[];
  fanOutQueries: string[];
  raw: unknown;
};

export type EngineFailure = {
  engine: EngineResponse["engine"];
  promptId: string;
  error: string;
  raw?: unknown;
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
  citations: Citation[];
  mentions: Mention[];
  awarenessStage: PromptAwarenessStage;
};
