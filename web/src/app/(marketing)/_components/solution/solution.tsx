'use client';

import Link from 'next/link';
import { FC } from 'react';

import { Button } from '@/components/ui/button';
import { links } from '@/config/links';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

import { FeatureCard } from './components';
import {
  TALL_SOLUTION_FEATURES,
  WIDE_SOLUTION_FEATURES,
} from './solution-features';
import type { SolutionFeature } from './types';

export const Solution: FC<{ className?: string }> = ({ className }) => (
  <section className={cn('padding-global', className)}>
    <div className="padding-section-medium container">
      <div className="flex flex-col gap-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[40px]">
          One agent for your AI search presence.
          <br />
          <span className="text-foreground-light">
            Tracks, publishes, and converts 24/7.
          </span>
        </h2>

        <div className="flex flex-wrap gap-3 sm:gap-4">
          <Button
            asChild
            size="lg"
            onClick={() => gaEvent('book_demo', { location: 'solution' })}
          >
            <Link href={links.demo}>Request a demo</Link>
          </Button>
        </div>
      </div>

      <FeatureGrid
        features={WIDE_SOLUTION_FEATURES}
        className="mt-8 md:mt-12 lg:mt-16"
      />
      <FeatureGrid
        features={TALL_SOLUTION_FEATURES}
        className="mt-6 lg:grid-cols-3"
      />
    </div>
  </section>
);

const FeatureGrid: FC<{ features: SolutionFeature[]; className?: string }> = ({
  features,
  className,
}) => (
  <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-2', className)}>
    {features.map(({ id, title, mutedTitle, layout, Preview, background }) => (
      <FeatureCard
        key={id}
        title={title}
        mutedTitle={mutedTitle}
        layout={layout}
        background={background}
      >
        <Preview />
      </FeatureCard>
    ))}
  </div>
);
