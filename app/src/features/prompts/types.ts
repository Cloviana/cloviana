import type { Tag } from '@/features/tags/types';
import type { Topic } from '@/features/topics/types';
import type { ID, ISODate } from '@/types/api';

export type PromptStage = 'AWARENESS' | 'CONSIDERATION' | 'EVALUATE' | 'DECIDE';

export type PromptBranding = 'BRANDED' | 'UNBRANDED';

export type PromptStatusFilter = 'active' | 'all' | 'inactive';

export type PromptListFilters = {
  status?: PromptStatusFilter;
  q?: string;
  topicIds?: string[];
  tagIds?: string[];
  branding?: PromptBranding[];
  stages?: PromptStage[];
};

export type Prompt = {
  id: ID;
  text: string;
  stage: PromptStage;
  active: boolean;
  branding: PromptBranding;
  createdAt: ISODate;
  topics: Array<Pick<Topic, 'id' | 'name'>>;
  tags: Array<Pick<Tag, 'id' | 'text'>>;
  mentions: Array<{ name: string; domain: string }>;
  metrics: {
    visibility: number | null;
    citationShare: number | null;
    sentiment: number | null;
    position: number | null;
    sov: number | null;
    webSearch: number | null;
  };
};

export type PromptPayload = {
  text: string;
  stage: PromptStage;
  active: boolean;
  branding: PromptBranding;
  topicIds?: ID[];
  tagIds?: ID[];
};

export type PageInfo = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type PromptPage = {
  items: Prompt[];
  pageInfo: PageInfo;
};

export type AiEngine = 'CHATGPT' | 'CLAUDE' | 'PERPLEXITY' | 'AI_OVERVIEWS';

export type PromptResponseListFilters = {
  engines?: AiEngine[];
  promptIds?: string[];
  topicIds?: string[];
  tagIds?: string[];
  webSearch?: boolean;
};

export type PromptOption = Pick<Prompt, 'id' | 'text'>;
export type PromptMutationResult = Pick<Prompt, 'id'>;

export type MentionRateGranularity = 'day' | 'week' | 'month';

export type PromptMentionRate = {
  from: ISODate;
  to: ISODate;
  granularity: MentionRateGranularity;
  series: Array<{
    brand: {
      id: ID;
      name: string;
      domain: string;
      kind: 'BUSINESS' | 'COMPETITOR';
    };
    points: Array<{
      date: ISODate;
      mentionRate: number;
    }>;
  }>;
};

export type PromptRankingItem = {
  rank: number;
  brand: {
    id: ID;
    name: string;
    domain: string;
    kind: 'BUSINESS' | 'COMPETITOR';
  };
  mentionRate: number;
  shareOfVoice: number;
  sentiment: number | null;
  position: number | null;
};

export type PromptRanking = {
  from: ISODate;
  to: ISODate;
  responseCount: number;
  items: PromptRankingItem[];
  mainBrand: PromptRankingItem | null;
};

export type PromptSourceView = 'top' | 'new' | 'trending' | 'losing';

export type CitationDomainType =
  | 'CORPORATE'
  | 'UGC'
  | 'OTHER'
  | 'REFERENCE'
  | 'COMPETITOR'
  | 'INSTITUTIONAL'
  | 'EDITORIAL';

export type CitationUrlType =
  | 'COMPARISON'
  | 'OTHER'
  | 'ARTICLE'
  | 'HOW_TO_GUIDE'
  | 'PRODUCT_PAGE'
  | 'DISCUSSION'
  | 'LISTICLE'
  | 'VIDEO'
  | 'PROFILE'
  | 'HOMEPAGE';

export type PromptSourceDomains = {
  from: ISODate;
  to: ISODate;
  view: PromptSourceView;
  items: Array<{
    domain: string;
    retrievals: number;
    previousRetrievals: number;
    change: number;
  }>;
};

export type PromptSourceUrls = {
  from: ISODate;
  to: ISODate;
  view: PromptSourceView;
  items: Array<{
    url: string;
    domain: string;
    title: string | null;
    retrievals: number;
    previousRetrievals: number;
    change: number;
  }>;
};

export type PromptSourceTypeDistribution<T extends string> = {
  from: ISODate;
  to: ISODate;
  totalRetrievals: number;
  unclassifiedRetrievals: number;
  items: Array<{
    type: T;
    retrievals: number;
    percentage: number;
  }>;
};

export type PromptDomainTypes =
  PromptSourceTypeDistribution<CitationDomainType>;

export type PromptUrlTypes = PromptSourceTypeDistribution<CitationUrlType>;

export type PromptFanOutQueryPage = {
  items: Array<{
    id: ID;
    query: string;
    engine: AiEngine;
  }>;
  pageInfo: PageInfo;
};

export type ClaimSentiment = 'POSITIVE' | 'NEGATIVE';

export type PromptBrandPerceptionPage = {
  items: Array<{
    id: ID;
    label: string;
    sentiment: ClaimSentiment;
    engine: AiEngine;
  }>;
  pageInfo: PageInfo;
};

export type PromptResponse = {
  id: ID;
  promptText: string;
  engine: AiEngine;
  /** Preview of the answer — the API clamps it for the list. */
  text: string | null;
  webSearch: boolean;
  createdAt: ISODate;
  metrics: {
    sentiment: number | null;
    position: number | null;
  };
  mentions: Array<{ name: string; domain: string }>;
  sources: Array<{ domain: string }>;
};

export type PromptResponseDetail = Omit<
  PromptResponse,
  'mentions' | 'sources'
> & {
  mentions: Array<{
    id: ID;
    /** Canonical brand name, used as the display label. */
    name: string;
    domain: string;
    /** Every spelling this brand is known by, including the one matched. */
    aliases: string[];
    kind: 'BUSINESS' | 'COMPETITOR';
    /** Share of this brand's claims in this answer that are positive, 0-100. */
    sentiment: number | null;
  }>;
  fanOutQueries: Array<{
    id: ID;
    query: string;
    /** True when Cloviana derived the query rather than the engine reporting it. */
    inferred: boolean;
  }>;
  sources: Array<{
    id: ID;
    url: string;
    domain: string;
    title: string | null;
  }>;
};

export type PromptResponsePage = {
  items: PromptResponse[];
  pageInfo: PageInfo;
};
