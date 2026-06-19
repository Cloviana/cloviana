import type { ISODate, JobStatus } from '@/types/api';

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
    engine: 'CLAUDE' | 'CHATGPT' | 'PERPLEXITY' | 'AI_OVERVIEWS';
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
      awarenessStage: 'EXPLORE' | 'EVALUATE' | 'DECIDE';
      lastRunAt: string | null;
      topics: string[];
    }>;
  };
  topics: Array<{ id: string; name: string; promptCount: number }>;
  competitors: Array<{ id: string; name: string; domain: string }>;
};
