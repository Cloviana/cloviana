'use client';

import { useQuery } from '@tanstack/react-query';

import { Audit, getAuditQueryOptions } from '@/features/audit';

import { AuditSkeleton } from './audit-skeleton';

import {
  Citation,
  FinalCta,
  ContentSuggestions,
  Hero,
  Overview,
  Sentiment,
  Visibility,
} from '.';

type AuditContentProps = {
  auditId: string;
  initialData: Audit | null;
};

export const AuditContent = ({ auditId, initialData }: AuditContentProps) => {
  const { data: audit } = useQuery({
    ...getAuditQueryOptions(auditId),
    initialData: initialData ?? undefined,
    refetchInterval: (query) => {
      const status = query.state.data?.job?.status;
      if (status === 'PENDING' || status === 'RUNNING') return 3000;
      return false;
    },
  });

  return (
    <>
      {!audit ? (
        <AuditSkeleton />
      ) : (
        <>
          <Hero auditId={auditId} audit={audit} />
          <Overview audit={audit} />
          <Sentiment audit={audit} />
          <Visibility audit={audit} />
          <Citation audit={audit} />
          <ContentSuggestions auditId={auditId} audit={audit} />
          <FinalCta auditId={auditId} />
        </>
      )}
    </>
  );
};
