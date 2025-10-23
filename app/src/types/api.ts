export type ID = string;
export type ISODate = string;

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
  | 'TITLE'
  | 'SECONDARY_KEYWORDS'
  | 'PRODUCT'
  | 'ENHANCEMENTS'
  | 'COMPLETED';
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
  title?: string;
  topic?: string;
  status: BlogStatus;
}>;

export type BlogDetail = Blog & {
  storeId: ID;
  jobId?: ID | null;
  productId?: ID | null;
  shopifyArticleId?: string | null;
  currentStep: BlogSetupStep;
  slug?: string;
  description?: string | null;
  brandVoice?: string | null;
  primaryKeyword?: string | null;
  secondaryKeywords?: string[];
  additionalInstruction?: string | null;
  nodes: Node[];
  job?: Job | null;
  thumbnail?: Thumbnail | null;
};

export type StoreDetail = Store & {
  channel?: Channel;
};

export type Product = Entity<{
  handle?: string | null;
  title: string;
  status: ProductStatus;
  description: string | null;
  tags: string[];
  imageUrl: string | null;
  category: string | null;
  syncedAt: ISODate | null;
  onlineStorePreviewUrl: string;
  onlineStoreUrl: string | null;
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
