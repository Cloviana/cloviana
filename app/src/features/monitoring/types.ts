import type { ISODate, JobStatus } from '@/types/api';

export type AiEngine = 'CLAUDE' | 'CHATGPT' | 'PERPLEXITY' | 'AI_OVERVIEWS';
export type MonitoringRange = 'D' | 'W' | 'M';
export type PromptAwarenessStage = 'EXPLORE' | 'EVALUATE' | 'DECIDE';
export type DomainType =
  | 'CORPORATE'
  | 'REFERENCE'
  | 'INSTITUTIONAL'
  | 'EDITORIAL'
  | 'UGC'
  | 'OTHER';
export type SourceOwnerType = 'OWN' | 'COMPETITOR' | 'THIRD_PARTY';

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MonitoringSourceSeries = {
  key: string;
  label: string;
  domain: string;
  color: string;
};

export type MonitoringTrendPoint = {
  bucket: string;
  label: string;
  [seriesKey: string]: string | number;
};

export type MonitoringMetric = {
  date: ISODate;
  mentionRate: number;
  citationShare: number;
  sov: number;
};

export type MonitoringOverview = {
  business: {
    id: string;
    name: string;
    domain: string;
    category: string | null;
    status: 'LOCKED' | 'PROCESSING' | 'ACTIVE' | 'FAILED';
  };
  latestRun: {
    id: string;
    status: JobStatus;
    error: string | null;
    createdAt: ISODate;
    finishedAt: ISODate | null;
  } | null;
  summary: MonitoringMetric | null;
  engines: Array<{
    engine: AiEngine;
    mentionRate: number;
    citationShare: number;
    sov: number;
  }>;
  trend: MonitoringMetric[];
  prompts: {
    active: number;
    monitored: number;
    list: Array<{
      id: string;
      text: string;
      awarenessStage: PromptAwarenessStage;
      lastRunAt: string | null;
      topics: string[];
    }>;
  };
  topics: Array<{ id: string; name: string; promptCount: number }>;
  competitors: Array<{ id: string; name: string; domain: string }>;
  matrix?: {
    brands: Array<{
      id: string | null;
      name: string;
      domain: string;
      isSelf: boolean;
    }>;
    engines: AiEngine[];
    values: Array<{
      competitorId: string | null;
      engine: AiEngine | null;
      mentionRate: number;
      citationShare: number;
      sov: number;
    }>;
  };
};

export type PromptResponseStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type PromptRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

export type MonitoringPromptResponse = {
  business: {
    name: string;
    domain: string;
  };
  totalPrompts: number;
  totalResponses: number;
  prompts: Array<{
    id: string;
    text: string;
    status: 'ACTIVE' | 'INACTIVE';
    awarenessStage: PromptAwarenessStage;
    lastRunAt: ISODate | null;
    latestRun: {
      id: string;
      status: PromptRunStatus;
      createdAt: ISODate;
      completedAt: ISODate | null;
    } | null;
    topics: Array<{ id: string; name: string }>;
    metrics: {
      date: ISODate | null;
      mentionRate: number;
      citationShare: number;
      sov: number;
    };
    engines: Array<{
      engine: AiEngine;
      status: PromptResponseStatus;
      createdAt: ISODate;
      mentionRate: number;
      citationShare: number;
      sov: number;
      text: string | null;
      error: string | null;
      fanOutQueries: string[];
      mentions: Array<{
        id: string;
        name: string;
        domain: string;
        position: number;
        competitorId: string | null;
        isOwn: boolean;
        isCompetitor: boolean;
      }>;
      competitorMentions: Array<{
        id: string;
        name: string;
        domain: string;
        position: number;
        competitorId: string | null;
      }>;
      citations: Array<{
        id: string;
        url: string;
        domain: string;
        title: string | null;
        position: number;
        isOwn: boolean;
        isCompetitor: boolean;
      }>;
    }>;
  }>;
};
