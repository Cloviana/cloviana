'use client';

import { useEffect } from 'react';

import type { JobStatus } from '@/types/api';

import { useGetJob } from '../api/get-job';

type Options = {
  businessId?: string | null;
  jobId?: string | null;
  initialStatus?: JobStatus;
  enabled?: boolean;
  pollMs?: number;
  staleTimeMs?: number;
  onSuccess?: () => void | Promise<void>;
  onFailure?: (status: JobStatus) => void | Promise<void>;
};

const ACTIVE: ReadonlyArray<JobStatus> = ['PENDING', 'RUNNING'];
const FAILURE: ReadonlyArray<JobStatus> = ['FAILED'];
const SUCCESS: JobStatus = 'SUCCESS';

export function useJobWatcher({
  businessId,
  jobId,
  initialStatus,
  enabled = true,
  pollMs = 3000,
  staleTimeMs = 15_000,
  onSuccess,
  onFailure,
}: Options) {
  const canStart = Boolean(businessId && jobId) && enabled;

  const { data } = useGetJob(businessId ?? '', jobId ?? '', {
    queryConfig: {
      enabled: canStart,
      staleTime: staleTimeMs,
      refetchInterval: (q) => {
        const status = (q.state.data?.job?.status ?? initialStatus) as
          | JobStatus
          | undefined;

        return status && ACTIVE.includes(status) ? pollMs : false;
      },
    },
  });

  const status = (data?.job?.status ?? initialStatus) as JobStatus | undefined;

  const isActive = status ? ACTIVE.includes(status) : false;
  const isSuccess = status === SUCCESS;
  const isFailure = status ? FAILURE.includes(status) : false;

  useEffect(() => {
    if (!status) return;
    if (isSuccess) void onSuccess?.();
    if (isFailure) void onFailure?.(status);
  }, [status, isSuccess, isFailure, onSuccess, onFailure]);

  return { data, status, isActive, isSuccess, isFailure };
}
