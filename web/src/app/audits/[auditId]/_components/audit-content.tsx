'use client';

import { useQuery } from '@tanstack/react-query';

import { Footer } from '@/components/layout/footer/default';
import { Navbar } from '@/components/layout/navbar/navbar';
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
    <div className="bg-background relative flex min-h-screen flex-col">
      <header className="sticky top-0 right-0 left-0 z-50">
        <Navbar />
      </header>

      <main className="flex-1 space-y-0">
        {!audit ? (
          <AuditSkeleton />
        ) : (
          <>
            <Hero auditId={auditId} audit={audit} />
            <Overview audit={audit} />
            <Visibility audit={audit} />
            <Sentiment audit={audit} />
            <Citation audit={audit} />
            <ContentSuggestions auditId={auditId} audit={audit} />
            <FinalCta auditId={auditId} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};
