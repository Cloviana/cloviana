import { Leaderboard } from '@/components/ui/leaderboard';
import { Audit } from '@/features/audit';
import { cn } from '@/utils/cn';

import { VisibilityChart } from './_ui/visibility-chart';

// ─── Types ────────────────────────────────────────────────────────────────────

type VisibilityAudit = Pick<
  Audit,
  'domain' | 'brandName' | 'visibilityLeaderboard' | 'brandVisibility'
>;

type VisibilityProps = {
  className?: string;
  audit: VisibilityAudit;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const Visibility = ({ className, audit }: VisibilityProps) => {
  const { domain, brandName, visibilityLeaderboard, brandVisibility } = audit;

  const brand = visibilityLeaderboard?.find((b) => b.domain === domain);
  const brandHeading = brand
    ? `${brand.name} is ranked #${brand.position} in visibility`
    : "You're not ranking";

  const leaderboardItems = (visibilityLeaderboard ?? []).map((b) => ({
    position: b.position,
    domain: b.domain,
    name: b.name,
    share: b.mentionShare,
  }));

  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-x-8 gap-y-3 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
          <h2 className="w-full text-3xl lg:w-1/2 lg:max-w-[22ch] lg:text-4xl">
            Are you getting recommended?
          </h2>
          <p className="text-foreground-light w-fit lg:max-w-[50ch] lg:pt-2 lg:text-lg">
            When a buyer asks ChatGPT or Perplexity for tools in your category,
            this is how often {brandName} comes up.
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Leaderboard */}
          <div className="w-full space-y-8 lg:w-1/2">
            <h3 className="text-lg font-medium">{brandHeading}</h3>
            <Leaderboard
              items={leaderboardItems}
              header={{ left: 'Company', right: 'Visibility' }}
              targetDomain={domain}
            />
          </div>

          {/* Chart */}
          <div className="flex w-full items-center justify-center lg:w-1/2">
            {brandVisibility && (
              <VisibilityChart brandVisibility={brandVisibility} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
