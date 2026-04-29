import type { Job, JobStatus, ISODate } from '@/types/api';

export type JobRuntime = {
  status: JobStatus;
  percent: number | null;
  step: string | null;
  title: string;
  updatedAt: ISODate;
  meta?: Record<string, unknown>;
};

export type JobWithRuntime = {
  job: Job;
  runtime: JobRuntime | null;
} | null;
