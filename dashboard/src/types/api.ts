// ─────────────────────────────────────────────────────────────────────────────
// Enum / literal‐union types
// ─────────────────────────────────────────────────────────────────────────────

export type StoreStatus = 'DRAFT' | 'ACTIVE';
export type PlanName = 'STANDARD' | 'PREMIUM' | 'BUSINESS';
export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'CANCELED'
  | 'PAST_DUE';
export type BlogType = 'HOW_TO' | 'LISTICLE';
export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type GenerationStatus = 'QUEUED' | 'IN_PROGRESS' | 'READY' | 'ERROR';

export type NodeType =
  | 'PARAGRAPH'
  | 'HEADING'
  | 'LIST'
  | 'LIST_ITEM'
  | 'CODE_BLOCK'
  | 'QUOTE'
  | 'IMAGE'
  | 'LINK'
  | 'TEXT';

export type GenerationStep =
  | 'TOPIC'
  | 'KEYWORD'
  | 'COMPETITORS'
  | 'TITLE'
  | 'SECONDARY_KEYWORDS'
  | 'META'
  | 'REVIEW'
  | 'COMPLETE';

// ─────────────────────────────────────────────────────────────────────────────
// Reusable primitives
// ─────────────────────────────────────────────────────────────────────────────

export type Link = {
  href: string;
  title?: string;
};

export type TextLeaf = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  link?: Link;
};

export type InlineStyles = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  subscript?: boolean;
  superscript?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared file-scoped types
// ─────────────────────────────────────────────────────────────────────────────

export type BaseEntity<T extends object = Record<string, never>> = T & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type Entity<T extends object = Record<string, never>> = BaseEntity<T>;

export type Meta = {
  page: number;
  total: number;
  totalPages: number;
};

// Node

type BaseNode = {
  key: string;
  parentKey?: string | null;
  sortOrder: number;
};

type PayloadByType = {
  TEXT: {
    text: string;
    styles?: InlineStyles | null;
  };
  PARAGRAPH: {
    indent?: number | null;
  };
  HEADING: {
    level: 2 | 3;
  };
  LIST_ITEM: Record<string, never>;
  LIST: {
    style: 'unordered' | 'ordered';
  };
};

export type Node = {
  [K in keyof PayloadByType]: BaseNode & {
    type: K;
    payload: PayloadByType[K];
  };
}[keyof PayloadByType];

// ─────────────────────────────────────────────────────────────────────────────
// Domain-specific types
// ─────────────────────────────────────────────────────────────────────────────

export type Store = Entity<{
  name: string;
  ownerId: string;
  domainUrl: string;
  profileUrl?: string;
  status: StoreStatus;
}>;

export type CheckoutSession = {
  url: string;
};

export type Plan = Entity<{
  stripePriceId: string;
  name: PlanName;
}>;

export type Subscription = Entity<{
  storeId: string;
  planId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
}> & {
  plan: Plan;
};

export type Channel = Entity<{
  shop: string;
}>;

export type Keyword = Entity<{
  phrase: string;
  volume: number;
  cpc: number;
  competition: number;
  intent: string;
  difficulty: number;
}>;

export type Blog = Entity<{
  title: string;
  topic: string;
  generationStep?: GenerationStep;
  keyword?: Pick<Keyword, 'id' | 'phrase'>;
  publishStatus: PublishStatus;
  thumbnail: Thumbnail | null;
}>;

export type Thumbnail = {
  blobPath: string;
  altText: string;
  srcUrl?: string;
};

export type BlogDetail = Blog & {
  brandVoice?: string;
  type: BlogType;
  generationStatus: GenerationStatus;
  storeId: string;
  slug?: string;
  description?: string;
  nodes: Node[];
};

export type StoreDetail = Store & {
  subscription?: Subscription;
  channel?: Channel;
};

export type PaginatedKeywords = {
  data: Keyword[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

export type RankedGoogleSearchItem = {
  title: string;
  link: string;
  snippet: string;
  recommended: boolean;
  logo: string;
};
