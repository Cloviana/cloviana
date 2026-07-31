import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { links } from '@/config/links';
import { Audit } from '@/features/audit';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type PromptsAudit = Pick<Audit, 'brandName' | 'promptCoverage'>;

type PromptsProps = {
  className?: string;
  auditId: string;
  audit: PromptsAudit;
};

// ─── Config ───────────────────────────────────────────────────────────────────

// Same progressive blur treatment as the Leaderboard: last 3 rows fade out.
const BLUR_PX = [0, 2, 4, 6];
const BLUR_OPACITY = [1, 0.7, 0.4, 0.2];

// ─── Sub-components ───────────────────────────────────────────────────────────

const RateCell = ({ value }: { value: number }) => (
  <td
    className={cn(
      'py-4 pl-6 text-right whitespace-nowrap tabular-nums',
      value > 0 ? 'text-foreground' : 'text-foreground-lighter',
    )}
  >
    {value.toFixed(0)}%
  </td>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const Prompts = ({ className, auditId, audit }: PromptsProps) => {
  const { brandName, promptCoverage } = audit;

  if (!promptCoverage?.length) return null;

  const hasLockedRows = promptCoverage.length > 4;

  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-x-8 gap-y-3 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
          <h2 className="w-full text-3xl lg:w-1/2 lg:max-w-[22ch] lg:text-4xl">
            What buyers ask AI before they buy
          </h2>
          <p className="text-foreground-light w-fit lg:max-w-[50ch] lg:pt-2 lg:text-lg">
            A sample of the real buying questions we put to ChatGPT, Perplexity,
            and Google AI Overviews. Every prompt where {brandName} doesn&apos;t
            appear is a shortlist you&apos;re not on.
          </p>
        </div>

        {/* Table */}
        <div className="relative">
          <table className="w-full">
            <thead>
              <tr className="text-foreground-lighter border-b text-left font-normal">
                <th className="w-full pb-4 font-normal">Prompt</th>
                <th className="pb-4 pl-6 text-right font-normal whitespace-nowrap">
                  Mentioned
                </th>
                <th className="pb-4 pl-6 text-right font-normal whitespace-nowrap">
                  Cited
                </th>
              </tr>
            </thead>
            <tbody>
              {promptCoverage.map((entry, i) => {
                const blurStart = Math.max(4, promptCoverage.length - 3);
                const lvl = Math.min(Math.max(0, i - blurStart + 1), 3);
                return (
                  <tr
                    key={entry.prompt}
                    style={
                      lvl > 0
                        ? {
                            filter: `blur(${BLUR_PX[lvl]}px)`,
                            opacity: BLUR_OPACITY[lvl],
                          }
                        : undefined
                    }
                    className={cn(
                      // collapsed table borders ignore the row's blur filter,
                      // so blurred rows drop their separator instead
                      lvl === 0 && i < promptCoverage.length - 1 && 'border-b',
                      lvl > 0 && 'pointer-events-none select-none',
                    )}
                  >
                    <td className="text-foreground py-4">{entry.prompt}</td>
                    <RateCell value={entry.mentionRate} />
                    <RateCell value={entry.citationRate} />
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* CTA overlay */}
          {hasLockedRows && (
            <div className="absolute right-0 bottom-0 left-0 flex h-32 items-center justify-center print:hidden">
              <Button
                onClick={() =>
                  gaEvent('book_demo', {
                    location: 'prompts',
                    audit_id: auditId,
                  })
                }
                variant="outline"
                size="lg"
              >
                <Link href={links.demo}>See how you rank on every prompt</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
