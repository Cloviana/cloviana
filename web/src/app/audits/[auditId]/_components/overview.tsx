import { Badge } from '@/components/ui/badge';
import { Audit } from '@/features/audit';
import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type OverviewAudit = Pick<
  Audit,
  | 'domain'
  | 'brandName'
  | 'visibilityLeaderboard'
  | 'citationLeaderboard'
  | 'sentiment'
>;

type OverviewProps = {
  className?: string;
  audit: OverviewAudit;
};

type Rating = 'Poor' | 'Fair' | 'Good';

type Metric = {
  title: string;
  description: string;
  value: number;
  rating: Rating;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const RATING_VARIANT: Record<Rating, 'destructive' | 'warning' | 'success'> = {
  Poor: 'destructive',
  Fair: 'warning',
  Good: 'success',
};

// Thresholds represent % values.
// Visibility: mention share across AI responses — small brands rarely exceed 35%.
// Sentiment:  % of mentions that are positive — 70%+ is a meaningful quality bar.
// Citation:   share-of-voice across all cited domains — 10% is strong for an SMB.
const THRESHOLDS: Record<string, { fair: number; good: number }> = {
  visibility: { fair: 15, good: 35 },
  sentiment: { fair: 40, good: 70 },
  citation: { fair: 3, good: 10 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRating(
  value: number,
  thresholds: { fair: number; good: number },
): Rating {
  if (value >= thresholds.good) return 'Good';
  if (value >= thresholds.fair) return 'Fair';
  return 'Poor';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const MetricCard = ({ title, description, value, rating }: Metric) => (
  <div className="flex flex-col justify-between px-8 py-6">
    <div className="space-y-1">
      <p className="text-foreground font-medium">{title}</p>
      <p className="text-foreground-light text-sm">{description}</p>
    </div>
    <div className="mt-5 flex items-center gap-2">
      <p className="text-2xl font-medium">{value.toFixed(1)}%</p>
      <Badge variant={RATING_VARIANT[rating]}>{rating}</Badge>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const Overview = ({ className, audit }: OverviewProps) => {
  const {
    domain,
    brandName,
    visibilityLeaderboard,
    citationLeaderboard,
    sentiment,
  } = audit;

  const visibilityEntry = visibilityLeaderboard?.find(
    (b) => b.domain === domain,
  );
  const citationEntry = citationLeaderboard?.find((b) => b.domain === domain);

  const visibilityScore = visibilityEntry?.mentionShare ?? 0;
  const sentimentScore = sentiment?.positivePercent ?? 0;
  const citationScore = citationEntry?.citationShare ?? 0;

  const metrics: Metric[] = [
    {
      title: 'Visibility Score',
      description: `${brandName} is mentioned in ${visibilityScore.toFixed(1)}% of responses in your category.`,
      value: visibilityScore,
      rating: getRating(visibilityScore, THRESHOLDS.visibility),
    },
    {
      title: 'Positive Sentiment',
      description: `When ${brandName} is mentioned, the sentiment is positive ${sentimentScore.toFixed(0)}% of the time.`,
      value: sentimentScore,
      rating: getRating(sentimentScore, THRESHOLDS.sentiment),
    },
    {
      title: 'Citation Share',
      description: `${domain} is cited in ${citationScore.toFixed(0)}% of responses in your category.`,
      value: citationScore,
      rating: getRating(citationScore, THRESHOLDS.citation),
    },
  ];

  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-x-8 gap-y-3 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
          <h2 className="w-full text-3xl lg:w-1/2 lg:max-w-[22ch] lg:text-4xl">
            {brandName}'s AI presence, scored
          </h2>
          <p className="text-foreground-light w-fit lg:max-w-[50ch] lg:pt-2 lg:text-lg">
            Three signals that determine whether AI recommends you — or your
            competitors — when a buyer asks.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 divide-y border md:grid-cols-3 md:divide-x md:divide-y-0">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </div>
    </section>
  );
};
