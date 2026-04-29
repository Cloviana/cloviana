import type { Business, ID } from '@/types/api';

export type BusinessEntry = {
  destination: 'setup' | 'business';
  businessId: ID | null;
};

export type BusinessSetup = {
  business: Business;
  shouldCollectHeardAboutUs: boolean;
};

export type BusinessCompetitorSuggestions = {
  suggestions: Array<{
    domain: string;
  }>;
};
