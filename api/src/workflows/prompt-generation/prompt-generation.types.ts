import {
  BuyerLanguageTypeSchema,
  SourceTypeSchema,
} from "@/workflows/prompt-generation/prompt-generation.schema";
import z from "zod";

export type SourceType = z.infer<typeof SourceTypeSchema>;

export type BuyerLanguageType = z.infer<typeof BuyerLanguageTypeSchema>;

export type BusinessProfile = {
  domain: string;
  name: string;
  description: string;
  icp: string;
  category: string;
};

export type Competitor = {
  id: string;
  domain: string;
  name: string;
};

export type PromptGenerationInput = {
  businessId: string;
  profile: BusinessProfile;
  competitors: Competitor[];
  extraContext?: string[];
};

export type Doc = {
  id: string;
  text: string;
  sourceType: SourceType;
  url?: string;
  title?: string;
};

export type BuyerLanguage = {
  id: string;
  text: string;
  signal: string;
  docId: string;
  type: BuyerLanguageType;
  sourceType: SourceType;
  score?: number;
};

export type Cluster = {
  id: string;
  name: string;
  description: string;
  buyerLanguageIds?: string[];
  representativeQuotes?: string[];
};

export type Prompt = {
  id: string;
  clusterId: string;
  text: string;
  stage: "EXPLORE" | "EVALUATE" | "DECIDE";
  score?: number;
  active?: boolean;
};

export type PromptUniverse = {
  prompts: Prompt[];
  clusters: Cluster[];
};
