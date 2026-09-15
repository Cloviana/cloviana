import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Audit } from '../types';

const auditKeys = {
  base: ['audit'] as const,
  detail: (auditSlug: string) =>
    [...auditKeys.base, 'detail', auditSlug] as const,
};

export const getAudit = (auditSlug: string) =>
  api.get<Audit>(`/audits/${auditSlug}`);

export const getAuditQueryOptions = (auditSlug: string) =>
  queryOptions({
    queryKey: auditKeys.detail(auditSlug),
    queryFn: () => getAudit(auditSlug),
  });

export const useGetAudit = (auditSlug: string) =>
  useQuery({
    ...getAuditQueryOptions(auditSlug),
    refetchInterval: (query) => {
      const status = query.state.data?.workflowRun?.status;
      if (status === 'PENDING' || status === 'RUNNING') return 3000;
      return false;
    },
  });
