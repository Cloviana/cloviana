'use client';

import { LinkIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Leaderboard } from '@/components/ui/leaderboard';
import { ShinyButton } from '@/components/ui/shiny-button';
import { links } from '@/config/links';
import { Audit } from '@/features/audit';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

type HeroProps = {
  className?: string;
  audit: Pick<Audit, 'domain' | 'brandName' | 'visibilityLeaderboard'>;
};

export const Hero = ({ className, audit }: HeroProps) => {
  const brand = audit.visibilityLeaderboard?.find(
    (b) => b.domain === audit.domain,
  );
  const rankLabel = brand
    ? `You rank ${ordinal(brand.position)}`
    : "You're not ranking";

  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:gap-12">
          <div className="w-full text-center md:w-1/2 md:text-left">
            <div className="space-y-2">
              <div className="mb-4 inline-flex items-center gap-2">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${audit.domain}&sz=32`}
                  alt={audit.domain}
                  width={18}
                  height={18}
                  className="rounded-sm"
                />
                <span>
                  {audit.brandName ?? audit.domain} AI Visibility Report
                </span>
              </div>
              <h1 className="text-4xl">
                {rankLabel}
                <br />
                in AI Visibility
              </h1>
              <p className="max-w-[55ch]">
                Your buyers are already asking ChatGPT and Perplexity which
                software to use. This report shows whether they're hearing your
                name — or your competitor's.
              </p>
            </div>
            <div className="mt-6 flex flex-col items-stretch gap-4 md:flex-row md:items-center">
              <ShinyButton>
                <Button
                  asChild
                  size={'lg'}
                  className="w-full md:w-auto"
                  onClick={() => gaEvent('book_demo', { location: 'hero' })}
                >
                  <Link href={links.demo}>Request a demo</Link>
                </Button>
              </ShinyButton>
              <Button
                variant="ghost"
                size="lg"
                onClick={() =>
                  navigator.clipboard.writeText(window.location.href)
                }
              >
                <LinkIcon />
                Copy report link
              </Button>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <Leaderboard
              items={(audit.visibilityLeaderboard ?? []).map((b) => ({
                position: b.position,
                domain: b.domain,
                name: b.name,
                share: b.mentionShare,
              }))}
              targetDomain={audit.domain}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
