import type { Business, ID, JobProgress, JobStatus } from '@/types/api';

export type BusinessEntry = {
  destination: 'setup' | 'business';
  businessId: ID | null;
};

export type BusinessSetup = {
  business: Business;
  shouldCollectHeardAboutUs: boolean;
  brandResearch: {
    id: string;
    status: JobStatus;
    error: string | null;
    createdAt: string;
    finishedAt: string | null;
    progress: JobProgress | null;
  } | null;
  promptResearch: {
    id: string;
    status: JobStatus;
    error: string | null;
    createdAt: string;
    finishedAt: string | null;
    progress: JobProgress | null;
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
  stage: 'EXPLORE' | 'EVALUATE' | 'DECIDE';
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
