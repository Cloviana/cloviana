export type ID = string;
export type ISODate = string;

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'INCOMPLETE'
  | 'TRIALLING';
export type PlanName = 'STARTER' | 'GROWTH' | 'PRO';
export type BusinessMembershipRole = 'OWNER' | 'MEMBER';
export type BusinessInviteStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REVOKED'
  | 'EXPIRED';
export type BusinessSetupStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type BusinessSetupStep =
  | 'DOMAIN'
  | 'PROFILE'
  | 'LOCATION'
  | 'COMPETITORS'
  | 'ATTRIBUTION'
  | 'TOPICS'
  | 'PROMPTS'
  | 'COMPLETED';

export type JobType =
  | 'SITE_AUDIT'
  | 'BUSINESS_INITIALIZATION'
  | 'PROMPT_RESEARCH'
  | 'PROMPT_GENERATION'
  | 'MONITORING';
export type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export type JobProgress = {
  percent: number | null;
  step: string | null;
  title: string;
  updatedAt: ISODate;
  meta?: Record<string, unknown>;
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

export type Competitor = Entity<{
  businessId: ID;
  domain: string;
  name: string;
}>;

export type Business = Entity<{
  name: string;
  ownerId: ID;
  domain: string;
  category?: string | null;
  stripeCustomerId?: string | null;
  profileUrl?: string | null;
  description?: string | null;
  icp?: string | null;
  location?: string | null;
  timezone?: string | null;
  industry?: string | null;
  distributionChannels: string[];
  selectedTopicIds: string[];
  searchIntentCommercial: number;
  searchIntentInformational: number;
  competitors: Competitor[];
  setupStatus: BusinessSetupStatus;
  setupStep: BusinessSetupStep;
  setupCompletedAt?: ISODate | null;
  monitoringEnabled?: boolean;
  subscription?: {
    status: SubscriptionStatus;
    trialEndsAt: ISODate | null;
    plan: {
      name: PlanName;
      stripePriceId: string;
    };
  };
}>;

export type Job = {
  id: ID;
  type: JobType;
  status: JobStatus;
  attempts: number;
  startedAt: ISODate | null;
  finishedAt: ISODate | null;
  lastHeartbeatAt: ISODate | null;
  progress: JobProgress | null;
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
