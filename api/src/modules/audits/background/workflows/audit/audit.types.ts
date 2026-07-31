export interface BusinessProfile {
  domain: string;
  name: string;
  description: string;
  icp: string;
  category: string;
}

export interface Competitor {
  id: string;
  domain: string;
  name: string;
}

export interface AuditInput {
  auditId: string;
  email: string;
  country: string;
  profile: BusinessProfile;
  competitors: Competitor[];
}

export interface AuditPrompt {
  id: string;
  text: string;
}

export type EngineName = "google-aio" | "chatgpt" | "perplexity";

export interface EngineSource {
  title: string;
  url: string;
  description: string;
}

export interface EngineMention {
  name: string;
  domain: string;
}

export interface EngineResult {
  promptId: string;
  prompt: string;
  engine: EngineName;
  status: "success" | "failed";
  text: string;
  sources: EngineSource[];
  mentions: EngineMention[];
}

export const CONTENT_TYPES = [
  "problem_solution",
  "comparison",
  "how_to_guide",
  "listicle",
  "case_study",
  "faq",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export interface ContentIdea {
  contentType: ContentType;
  title: string;
  overview: string;
}

export interface SentimentResponse {
  id: string;
  prompt: string;
  text: string;
  platform: "chatgpt" | "google_aio";
}

export interface SentimentClaim {
  label: string;
  sentiment: "positive" | "negative";
  responseId: string;
  sourceText: string;
}

export interface SentimentResult {
  positivePercent: number;
  negativePercent: number;
  claims: SentimentClaim[];
  responses: SentimentResponse[];
}

export interface AuditRunResult extends AuditInput {
  prompts: AuditPrompt[];
  engineResponses: EngineResult[];
  contentIdeas: ContentIdea[];
  sentimentResult: SentimentResult;
}

export interface CitedPage {
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
  citationShare: number;
}

export interface CitedDomain {
  position: number;
  domain: string;
  citationShare: number;
}

export interface MentionedBrand {
  position: number;
  domain: string;
  name: string | null;
  mentionShare: number;
}

export interface BrandVisibility {
  google_aio: number;
  chatgpt: number;
  perplexity: number;
  overall: number;
}

export interface AuditPromptCoverage {
  prompt: string;
  mentionRate: number;
  citationRate: number;
}

export interface AuditReport {
  topPages: CitedPage[];
  citationLeaderboard: CitedDomain[];
  visibilityLeaderboard: MentionedBrand[];
  sentiment: SentimentResult;
  contentSuggestions: ContentIdea[];
  brandVisibility: BrandVisibility;
  promptCoverage: AuditPromptCoverage[];
}
