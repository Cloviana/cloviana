import type { ID, ISODate } from '@/types/api';

export type BlogDraftStatus = 'READY' | 'FLAGGED';

export type BlogDraftSummary = {
  id: ID;
  jobId: string | null;
  title: string;
  status: BlogDraftStatus;
  createdAt: ISODate;
};

export type BlogDraft = BlogDraftSummary & {
  businessId: string;
  body: string;
  violations: string[] | null;
  sources: { title: string; url: string }[] | null;
  updatedAt: ISODate;
};
