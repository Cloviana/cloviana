'use client';

import { useEffect, useState } from 'react';

export type ResearchJob = {
  workflowRunId: string;
  name: string;
};

type ResearchType = 'product' | 'content-type';

export function usePersistedResearchJobs(
  businessId: string,
  researchType: ResearchType,
) {
  const storageKey = `brand-kit:${businessId}:${researchType}-research`;
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ResearchJob[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(storageKey) ?? '[]',
      ) as unknown;
      setJobs(Array.isArray(stored) ? stored.flatMap(parseResearchJob) : []);
    } catch {
      window.localStorage.removeItem(storageKey);
      setJobs([]);
    } finally {
      setLoadedStorageKey(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(jobs));
  }, [jobs, loadedStorageKey, storageKey]);

  return [jobs, setJobs] as const;
}

function parseResearchJob(value: unknown): ResearchJob[] {
  if (typeof value !== 'object' || value === null) return [];

  const stored = value as Record<string, unknown>;
  const name = stored.name ?? stored.productName ?? stored.contentTypeName;

  return typeof stored.workflowRunId === 'string' && typeof name === 'string'
    ? [{ workflowRunId: stored.workflowRunId, name }]
    : [];
}
