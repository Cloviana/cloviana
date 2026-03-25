import { ArrowUpRight } from 'lucide-react';

import { Leaderboard } from '@/components/ui/leaderboard';
import { Audit } from '@/features/audit';
import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type CitationAudit = Pick<
  Audit,
  'domain' | 'brandName' | 'citationLeaderboard' | 'topPages'
>;

type CitationProps = {
  className?: string;
  audit: CitationAudit;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

type PageCardProps = {
  page: NonNullable<CitationAudit['topPages']>[number];
};

const PageCard = ({ page }: PageCardProps) => (
  <a
    key={page.url}
    href={page.url}
    target="_blank"
    rel="noopener noreferrer"
    className="bg-surface flex flex-1 flex-col rounded-xl p-5 transition-opacity hover:opacity-80"
  >
    <div className="mb-3 flex items-center gap-3.5">
      <span className="text-foreground shrink-0 text-sm tabular-nums">
        {page.position}
      </span>

      <div className="flex flex-1 items-center gap-2">
        <img
          src={`https://www.google.com/s2/favicons?domain=${page.domain}&sz=32`}
          alt={page.domain}
          width={16}
          height={16}
          className="rounded-sm"
        />
        <span className="text-foreground flex-1 truncate text-sm">
          {page.domain}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-foreground text-sm tabular-nums">
          {page.citationShare.toFixed(1)}%
        </span>
        <ArrowUpRight size={14} className="text-foreground-lighter shrink-0" />
      </div>
    </div>

    <p className="font-medium">{page.title}</p>
    <p className="text-foreground-light line-clamp-2 text-sm">
      {page.description}
    </p>
  </a>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const Citation = ({ className, audit }: CitationProps) => {
  const { domain, citationLeaderboard, topPages } = audit;

  const brand = citationLeaderboard?.find((b) => b.domain === domain);
  const brandHeading = brand
    ? `${domain} is ranked #${brand.position} in AI responses`
    : `${domain} is not cited in AI responses`;

  const leaderboardItems = (citationLeaderboard ?? []).map((b) => ({
    position: b.position,
    domain: b.domain,
    share: b.citationShare,
  }));

  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-x-8 gap-y-3 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
          <h2 className="w-full text-3xl lg:w-1/2 lg:max-w-[22ch] lg:text-4xl">
            Who AI trusts as a source
          </h2>
          <p className="text-foreground-light w-fit lg:max-w-[50ch] lg:pt-2 lg:text-lg">
            These are the pages AI references when answering buyer questions in
            your category. The more {domain} appears here, the more AI treats
            you as authoritative.
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Leaderboard */}
          <div className="w-full space-y-8 lg:w-1/2">
            <h3 className="text-lg font-medium">{brandHeading}</h3>
            <Leaderboard
              items={leaderboardItems}
              header={{ left: 'Company', right: 'Citation' }}
              targetDomain={domain}
            />
          </div>

          {/* Top Pages */}
          <div className="flex w-full flex-col gap-4 lg:w-1/2">
            <h3 className="text-lg font-medium lg:text-right">
              Most frequently cited pages
            </h3>
            <div className="flex flex-1 flex-col gap-3">
              {(topPages ?? []).map((page) => (
                <PageCard key={page.url} page={page} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
