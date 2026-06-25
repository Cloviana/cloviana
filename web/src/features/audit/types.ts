export type AuditJobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export type ContentType =
  | 'problem_solution'
  | 'comparison'
  | 'how_to_guide'
  | 'listicle'
  | 'case_study'
  | 'faq';

export type MentionedBrand = {
  position: number;
  domain: string;
  name: string | null;
  mentionShare: number;
};

export type CitedDomain = {
  position: number;
  domain: string;
  citationShare: number;
};

export type CitedPage = {
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
  citationShare: number;
};

export type ContentIdea = {
  contentType: ContentType;
  title: string;
  overview: string;
};

export type SentimentClaim = {
  label: string;
  sentiment: 'positive' | 'negative';
  responseId: string;
  sourceText: string;
};

export type SentimentResponse = {
  id: string;
  prompt: string;
  text: string;
  platform: 'chatgpt' | 'google_aio';
};

export type SentimentResult = {
  positivePercent: number;
  negativePercent: number;
  claims: SentimentClaim[];
  responses: SentimentResponse[];
};

export type BrandVisibility = {
  google_aio: number;
  chatgpt: number;
  perplexity: number;
  overall: number;
};

export type Audit = {
  id: string;
  slug: string;
  email: string;
  domain: string;
  country: string;
  brandName: string | null;
  jobId: string | null;
  createdAt: string;
  updatedAt: string;
  visibilityLeaderboard: MentionedBrand[] | null;
  citationLeaderboard: CitedDomain[] | null;
  sentiment: SentimentResult | null;
  topPages: CitedPage[] | null;
  contentSuggestions: ContentIdea[] | null;
  brandVisibility: BrandVisibility | null;
  job: { status: AuditJobStatus; error: string | null } | null;
};
