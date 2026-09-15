export type ID = string;
export type ISODate = string;

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'INCOMPLETE'
  | 'TRIALING';
export type PlanName = 'STARTER' | 'GROWTH' | 'PRO';
export type BusinessMembershipRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type BusinessInviteStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REVOKED'
  | 'EXPIRED';

export type WorkflowRunType =
  | 'BUSINESS_INITIALIZATION'
  | 'PROMPT_RESEARCH'
  | 'PROMPT_GENERATION'
  | 'PRODUCT_RESEARCH'
  | 'CONTENT_TYPE_RESEARCH'
  | 'MONITORING';
export type WorkflowRunStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

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

export type Competitor = Entity<{
  brandKitId: ID;
  domain: string;
  name: string;
  aliases: string[];
}>;

export type Business = Entity<{
  ownerId: ID;
  stripeCustomerId?: string | null;
  profileUrl?: string | null;
  brand: Entity<{
    brandKitId: ID;
    kind: 'BUSINESS';
    domain: string;
    name: string;
    aliases: string[];
  }>;
  icp?: string | null;
  location?: string | null;
  timezone?: string | null;
  industry?: string | null;
  distributionChannels: string[];
  selectedTopicIds: string[];
  searchIntentCommercial: number;
  searchIntentInformational: number;
  competitors: Competitor[];
  subscription?: {
    status: SubscriptionStatus;
    plan: {
      name: PlanName;
      stripePriceId: string;
    };
  };
}>;

export type WorkflowRun = {
  id: ID;
  type: WorkflowRunType;
  status: WorkflowRunStatus;
  eventId: string | null;
  progress: unknown | null;
  result: unknown | null;
  startedAt: ISODate | null;
  finishedAt: ISODate | null;
  error: string | null;
  createdAt: ISODate;
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

export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'READY';

export type Folder = Entity<{
  businessId: ID;
  parentId: ID | null;
  name: string;
  position: number;
  isDefault: boolean;
  _count: {
    children: number;
    documents: number;
  };
}>;

export type Document = Entity<{
  businessId: ID;
  folderId: ID;
  name: string;
  extension: string;
  filename: string | null;
  mimeType: string | null;
  sizeBytes: number;
  position: number;
  status: DocumentStatus;
  chunkCount: number | null;
  indexedAt: ISODate | null;
  folder: {
    id: ID;
    name: string;
    parentId: ID | null;
  };
}>;
