import type { Business, ID, JobStatus } from '@/types/api';

export type BusinessEntry = {
  destination: 'setup' | 'business';
  businessId: ID | null;
};

export type BusinessSetup = {
  business: Business;
  shouldCollectHeardAboutUs: boolean;
  promptResearch: {
    id: string;
    status: JobStatus;
    error: string | null;
    createdAt: string;
    finishedAt: string | null;
    promptUniverse: PromptUniverse | null;
  } | null;
};

export type PromptCluster = {
  id: string;
  name: string;
  description: string;
  buyerLanguageIds?: string[];
  representativeQuotes?: string[];
};

export type GeneratedPrompt = {
  id: string;
  clusterId: string;
  text: string;
  stage: 'AWARENESS' | 'EXPLORE' | 'CONSIDERATION' | 'EVALUATE' | 'DECIDE';
  score?: number;
  active?: boolean;
};

export type PromptUniverse = {
  clusters: PromptCluster[];
  prompts: GeneratedPrompt[];
};

export type BusinessCompetitorSuggestions = {
  suggestions: Array<{
    domain: string;
  }>;
};
