export interface ProductContext {
  summary: string;
  brandName: string;
  icp: string;
  category: string;
}

export interface SelectedUrls {
  homepage: string;
  collections: string[];
  products: string[];
  info: string[];
}

export interface Topic {
  name: string;
  prompts: string[];
}

export type EngineName = "google_aio" | "chatgpt" | "perplexity";

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
  prompt: string;
  engine: EngineName;
  text: string;
  sources: EngineSource[];
  mentions: EngineBrand[];
}

export interface EngineMetrics {
  google_aio: number;
  chatgpt: number;
  perplexity: number;
  overall: number;
}

export interface DomainMetrics {
  domain: string;
  name: string | null;
  visibility: EngineMetrics;
  citation: EngineMetrics;
}

export interface Competitor {
  domain: string;
  title: string | null;
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
