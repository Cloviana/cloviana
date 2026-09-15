import type {
  AiEngine,
  CitationDomainType,
  CitationUrlType,
  MetricEngine,
  PromptAwarenessStage,
} from "@prisma/client";

export interface MonitoringCitation {
  url: string;
  canonicalUrl: string;
  title: string;
  excerpt: string;
  urlType: CitationUrlType | null;
  domainType: CitationDomainType | null;
}

export type MonitoringCitationClassification = Pick<
  MonitoringCitation,
  "urlType" | "domainType"
>;

export interface MonitoringMention {
  domain: string;
  position: number;
}

export interface MonitoringFanOutQuery {
  query: string;
  inferred: boolean;
}

export interface MonitoringSentimentEvidence {
  startOffset: number;
  endOffset: number;
}

export interface MonitoringSentimentClaim {
  /** Domain of the tracked brand this claim evaluates. */
  brandDomain: string;
  label: string;
  sentiment: "POSITIVE" | "NEGATIVE";
  evidences: MonitoringSentimentEvidence[];
}

export interface MonitoringEngineResponse {
  responseKey: string;
  engine: AiEngine;
  promptId: string;
  content: string;
  webSearch: boolean;
  citations: MonitoringCitation[];
  mentions: MonitoringMention[];
  fanOutQueries: MonitoringFanOutQuery[];
  sentimentClaims: MonitoringSentimentClaim[];
}

export interface MonitoringPrompt {
  id: string;
  text: string;
}

// One tracked brand: the business itself or one of its competitors. Both are
// treated uniformly here — no more distinguishing "us" from "them" by id.
export interface MonitoringBrand {
  id: string;
  kind: "BUSINESS" | "COMPETITOR";
  domain: string;
  name: string;
  aliases: string[];
}

export interface MonitoringRunInput {
  businessId: string;
  prompts: MonitoringPrompt[];
  brands: MonitoringBrand[];
  date: Date;
}

export interface SerializedMonitoringRunInput
  extends Omit<MonitoringRunInput, "date"> {
  dateIso: string;
}

export interface MonitoringRunEventData extends Record<string, unknown> {
  workflowRunId: string;
  businessId: string;
  promptIds: string[];
  runDateIso: string;
}

export interface MonitoringRunSummary {
  date: string;
  promptCount: number;
  responseCount: number;
  promptMetricCount: number;
  businessMetricCount: number;
}

export interface ComputedPromptMetric {
  businessId: string;
  promptId: string;
  brandId: string;
  date: Date;
  mentionRate: number;
  citationShare: number;
  shareOfVoice: number;
  positiveClaimCount: number | null;
  negativeClaimCount: number | null;
  positiveSentimentShare: number | null;
}

export interface ComputedBusinessMetric {
  businessId: string;
  brandId: string;
  engine: MetricEngine;
  date: Date;
  mentionRate: number;
  citationShare: number;
  shareOfVoice: number;
  positiveClaimCount: number | null;
  negativeClaimCount: number | null;
  positiveSentimentShare: number | null;
}

export interface MonitoringRunResult extends MonitoringRunInput {
  engineResponses: MonitoringEngineResponse[];
  promptMetrics: ComputedPromptMetric[];
}

export interface MonitoringMetricResponse {
  engine: AiEngine;
  promptId: string;
  citations: Pick<MonitoringCitation, "url" | "title">[];
  mentions: Pick<MonitoringMention, "domain">[];
  sentimentClaims: Array<
    Pick<MonitoringSentimentClaim, "sentiment"> & {
      // Null only for rows written before sentiment was analysed per brand.
      brandDomain: string | null;
    }
  >;
  awarenessStage: PromptAwarenessStage;
}
