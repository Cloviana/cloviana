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
  auditSlug: string;
  initialData: Audit | null;
};

export const AuditContent = ({ auditSlug, initialData }: AuditContentProps) => {
  const { data: audit } = useQuery({
    ...getAuditQueryOptions(auditSlug),
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
          <Hero auditId={auditSlug} audit={audit} />
          <Overview audit={audit} />
          <Sentiment audit={audit} />
          <Visibility audit={audit} />
          <Citation audit={audit} />
          <ContentSuggestions auditId={auditSlug} audit={audit} />
          <FinalCta auditId={auditSlug} />
        </>
      )}
    </>
  );
};
