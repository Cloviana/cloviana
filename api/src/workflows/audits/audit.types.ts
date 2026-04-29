export interface BusinessProfile {
  domain: string;
  name: string;
  description: string;
  icp: string;
  category: string;
}

export type EngineName = "google-aio" | "chatgpt" | "perplexity";

export interface EngineSource {
  title: string;
  url: string;
  description: string;
}

export interface EngineBrand {
  name: string;
  domain: string | null;
}

export interface EngineResult {
  promptId: string;
  prompt: string;
  engine: EngineName;
  text: string;
  sources: EngineSource[];
  mentions: EngineBrand[];
}

export interface Competitor {
  id: string;
  domain: string;
  name: string;
}

export enum ContentType {
  PROBLEM_SOLUTION = "problem_solution",
  COMPARISON = "comparison",
  HOW_TO_GUIDE = "how_to_guide",
  LISTICLE = "listicle",
  CASE_STUDY = "case_study",
  FAQ = "faq",
}

export type {
  ContentIdea,
  SentimentResponse,
  SentimentClaim,
  SentimentResult,
} from "./audit.schemas";
