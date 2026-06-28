import type { ID } from '@/types/api';

export type BusinessEntry = {
  destination: 'business';
  businessId: ID | null;
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
