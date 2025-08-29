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
  HEADING: { tag: 'h2' | 'h3' | 'h1' | 'h5' | 'h6' | 'h4' };
  LIST_ITEM: Record<string, never>;
  LIST: { listType: 'bullet' | 'number' | 'check' };
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

export type Intent = 'I' | 'C' | 'L' | 'N';

export type Keyword = Entity<{
  phrase: string;
  volume: number;
  difficulty: number;
  competition: number;
  intents: Intent[];
  historyTrend: Record<string, number>;
}>;

export type Thumbnail = {
  blobPath: string;
  altText: string;
  srcUrl?: string;
};

export type Blog = Entity<{
  title: string;
  topic: string;
  generationStep?: GenerationStep;
  keyword?: Pick<Keyword, 'id' | 'phrase'>;
  publishStatus: PublishStatus;
  thumbnail: Thumbnail | null;
}>;

export type BlogDetail = Blog & {
  brandVoice?: string;
  type: BlogType;
  storeId: ID;
  jobId?: ID;
  slug?: string;
  description?: string;
  nodes: Node[];
  job?: Job | null;
};

export type StoreDetail = Store & {
  channel?: Channel;
};

export type Product = Entity<{
  handle: string;
  title: string;
  status: string;
  description: string | null;
  tags: string[];
  imageUrl: string | undefined;
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
