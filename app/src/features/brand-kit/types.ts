import type { ID } from '@/types/api';

export type RuleScope = 'GLOBAL' | 'AUDIENCE' | 'REGION' | 'CONTENT_TYPE';
export type SampleKind = 'URL' | 'TEXT';

export type BrandKitBrand = {
  name: string;
  domain: string;
};

export type BrandKitProduct = {
  id: ID;
  name: string;
  description: string | null;
  positioning: string | null;
  idealCustomer: string | null;
  competitorBrandIds: ID[];
};

export type BrandKitContentType = {
  id: ID;
  name: string;
  ctaText: string | null;
  ctaUrl: string | null;
};

export type BrandKitAudience = {
  id: ID;
  name: string;
  description: string | null;
};

export type BrandKitRegion = {
  id: ID;
  name: string;
  description: string | null;
};

export type BrandKitRule = {
  id: ID;
  scope: RuleScope;
  content: string;
  position: number;
  audienceId: ID | null;
  regionId: ID | null;
  contentTypeId: ID | null;
};

export type BrandKitSample = {
  id: ID;
  contentTypeId: ID;
  audienceIds: ID[];
  regionIds: ID[];
  kind: SampleKind;
  value: string;
  content?: string | null;
};

export type BrandKit = {
  id: ID | null;
  brand: BrandKitBrand;
  about: string | null;
  voice: string | null;
  writerPersona: string | null;
  draftRevision: number;
  products: BrandKitProduct[];
  contentTypes: BrandKitContentType[];
  audiences: BrandKitAudience[];
  regions: BrandKitRegion[];
  rules: BrandKitRule[];
  samples: BrandKitSample[];
};
