import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Audit } from '../types';

const auditKeys = {
  base: ['audit'] as const,
  detail: (auditId: string) => [...auditKeys.base, 'detail', auditId] as const,
};

export const getAudit = (auditId: string) =>
  api.get<Audit>(`/audits/${auditId}`);

export const getAuditQueryOptions = (auditId: string) =>
  queryOptions({
    queryKey: auditKeys.detail(auditId),
    queryFn: () => getAudit(auditId),
  });

export const useGetAudit = (auditId: string) =>
  useQuery({
    ...getAuditQueryOptions(auditId),
    refetchInterval: (query) => {
      const status = query.state.data?.job?.status;
      if (status === 'PENDING' || status === 'RUNNING') return 3000;
      return false;
    },
  });
