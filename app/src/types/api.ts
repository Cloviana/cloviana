export type ID = string;
export type ISODate = string;

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'INCOMPLETE'
  | 'TRIALLING';
export type PlanName = 'STARTER' | 'GROWTH' | 'PRO';

export type JobType =
  | 'PRODUCT_SYNC'
  | 'BLOG_GENERATION'
  | 'SITEMAP_BUILD'
  | 'KEYWORD_DISCOVERY';
export type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
export type StoreStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INITIALIZING'
  | 'FAILED'
  | 'LOCKED';
export type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'UNPUBLISHED';
export type BlogSetupStep =
  | 'TOPIC'
  | 'PRIMARY_KEYWORD'
  | 'SECONDARY_KEYWORDS'
  | 'PRODUCT'
  | 'GUIDELINES'
  | 'COMPLETED';
export type BlogContentType = 'PROBLEM_SOLUTION' | 'COMPARISON';
export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export type NodeType =
  | 'PARAGRAPH'
  | 'HEADING'
  | 'LIST'
  | 'LIST_ITEM'
  | 'CODE_BLOCK'
  | 'QUOTE'
  | 'IMAGE'
  | 'LINK'
  | 'TEXT'
  | 'LINEBREAK';

export type SearchIntent =
  | 'INFORMATIONAL'
  | 'NAVIGATIONAL'
  | 'COMMERCIAL'
  | 'TRANSACTIONAL';
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type AutopilotContentMix =
  | 'BALANCED'
  | 'PROBLEM_SOLUTION'
  | 'COMPARISON';

export type Link = {
  href: string;
  title?: string;
};

export type Entity<T extends object> = T & {
  id: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type Meta = {
  page: number;
  total: number;
  totalPages: number;
};

type BaseNode = {
  key: string;
  parentKey?: string | null;
  sortOrder: number;
};

type PayloadByType = {
  TEXT: { text: string; format: number };
  PARAGRAPH: Record<string, never>;
  HEADING: { tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' };
  LIST_ITEM: Record<string, never>;
  LIST: { listType: 'bullet' | 'number' | 'check' };
  LINK: { href: string; title?: string };
  QUOTE: Record<string, never>;
  LINEBREAK: Record<string, never>;
  IMAGE: { src: string; altText: string };
};

export type Node = {
  [K in keyof PayloadByType]: BaseNode & { type: K; payload: PayloadByType[K] };
}[keyof PayloadByType];

export type Store = Entity<{
  name: string;
  ownerId: ID;
  domainUrl: string;
  profileUrl?: string;
  status: StoreStatus;
  subscription?: {
    status: SubscriptionStatus;
    trialEndsAt: ISODate;
    plan: {
      name: PlanName;
      stripePriceId: string;
    };
  };
}>;

export type Channel = Entity<{
  shop: string;
}>;

export type Thumbnail = {
  blobPath: string;
  altText: string;
  srcUrl?: string;
};

export type Blog = Entity<{
  topic?: string;
  status: BlogStatus;
  storeId: ID;
  primaryKeyword?: string | null;
  thumbnail?: Thumbnail | null;
  productsCount: number;
  job?: Pick<
    Job,
    'id' | 'status' | 'startedAt' | 'finishedAt' | 'error'
  > | null;
}>;

export type BlogDetail = {
  storeId: ID;
  jobId?: ID | null;
  shopifyArticleId?: string | null;
  currentStep: BlogSetupStep;
  slug?: string;
  description?: string | null;
  brandVoice?: string | null;
  contentType?: BlogContentType | null;
  searchIntent?: SearchIntent | null;
  primaryKeyword?: string | null;
  secondaryKeywords?: string[];
  title?: string;
  topic?: string;
  status: BlogStatus;
  nodes: Node[];
  job?: Pick<
    Job,
    'id' | 'status' | 'startedAt' | 'finishedAt' | 'error'
  > | null;
  thumbnail?: Thumbnail | null;
  products: Product[];
  collections: Collection[];
};

export type AutopilotBlogSettings = {
  collectionIds: string[];
  contentMix: AutopilotContentMix;
  publishDays: DayOfWeek[];
  autoPublish: boolean;
};

export type AutopilotSettings = {
  enabled: boolean;
  blog: AutopilotBlogSettings | null;
};

export type StoreDetail = Store & {
  channel?: Channel;
};

export type Product = Entity<{
  id: string;
  storeId: string;
  externalId: string;
  title: string;
  slug: string | null;
  status: ProductStatus;
  description: string | null;
  imageUrl: string | null;
  url: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}>;

export type Collection = Entity<{
  id: string;
  storeId: string;
  externalId: string;
  title: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  url: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  productsCount?: number;
}>;

export type Job = {
  id: ID;
  type: JobType;
  storeId: ID | null;
  status: JobStatus;
  priority: number;
  attempts: number;
  scheduledAt: ISODate | null;
  startedAt: ISODate | null;
  finishedAt: ISODate | null;
  lastHeartbeatAt: ISODate | null;
  error: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type JobRuntime = {
  status: JobStatus;
  percent: number | null;
  step: string | null;
  title: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
};

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CursorPaginationMeta {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: CursorPaginationMeta;
}

export type SearchCatalogResponse = {
  products: { id: string; title: string; imageUrl: string }[];
  collections: { id: string; title: string; imageUrl: string }[];
};

export type KeywordCandidate = {
  id: number;
  keyword: string;
  volume: number;
  difficulty: number | null;
  intent: string | null;
};

export type SuggestedKeyword = KeywordCandidate & {
  recommended: boolean;
};
