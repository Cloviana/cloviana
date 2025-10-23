'use client';

import { useEffect } from 'react';

import { useGetJob } from '@/api/jobs/get-job';
import type { JobStatus } from '@/types/api';

type Options = {
  storeId?: string | null;
  jobId?: string | null;
  initialStatus?: JobStatus;
  activeStatuses?: ReadonlyArray<JobStatus>;
  successStatus?: JobStatus;
  failureStatuses?: ReadonlyArray<JobStatus>;
  pollMs?: number;
  staleTimeMs?: number;
  enabled?: boolean;
  onSuccess?: () => void | Promise<void>;
  onFailure?: (status: JobStatus) => void | Promise<void>;
};

const DEFAULT_ACTIVE: ReadonlyArray<JobStatus> = ['PENDING', 'RUNNING'];

export function useJobWatcher({
  storeId,
  jobId,
  initialStatus,
  activeStatuses = DEFAULT_ACTIVE,
  successStatus = 'SUCCESS',
  failureStatuses = ['FAILED'],
  pollMs = 3000,
  staleTimeMs = 15_000,
  enabled = true,
  onSuccess,
  onFailure,
}: Options) {
  const canStart =
    Boolean(storeId && jobId) &&
    enabled &&
    (initialStatus
      ? activeStatuses.includes(initialStatus) ||
        initialStatus === successStatus
      : true);

  const { data: job } = useGetJob(storeId || '', jobId || '', {
    queryConfig: {
      enabled: canStart,
      refetchInterval: (q) => {
        const s = (q.state.data?.status || initialStatus) as
          | JobStatus
          | undefined;
        return s && activeStatuses.includes(s) ? pollMs : false;
      },
      staleTime: staleTimeMs,
    },
  });

  const status = (job?.status ?? initialStatus) as JobStatus | undefined;
  const isActive = status ? activeStatuses.includes(status) : false;
  const isSuccess = status === successStatus;
  const isFailure = status ? failureStatuses.includes(status) : false;

  useEffect(() => {
    if (!status) return;
    if (isSuccess) void onSuccess?.();
    else if (isFailure) void onFailure?.(status);
  }, [status, isSuccess, isFailure, onSuccess, onFailure]);

  return { job, status, isActive, isSuccess, isFailure };
}
