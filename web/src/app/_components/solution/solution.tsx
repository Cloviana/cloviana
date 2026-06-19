'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';

import { AIVisibilityCard } from '@/app/_components/solution/components/ai-visibility-card';
import GEOContentCard from '@/app/_components/solution/components/geo-content-card';
import { OrbitalParticles } from '@/app/_components/solution/components/orbital-particles';
import { SlackChannel } from '@/app/_components/solution/components/slack-channel';
import { Button } from '@/components/ui/button';
import { links } from '@/config/links';
import { paths } from '@/config/paths';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

const CARD_BASE =
  'relative flex flex-col justify-between overflow-hidden rounded-2xl w-full aspect-[343/429] lg:aspect-[644/483] min-h-[520px] lg:min-h-[483px]';

const FeatureCard: FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <div
    className={cn(
      CARD_BASE,
      'bg-hero-surface border-hero-surface-border border',
      className,
    )}
  >
    {children}
  </div>
);

const FeatureCardHeading: FC<{
  title: string;
  subtitle: string;
  light?: boolean;
}> = ({ title, subtitle, light = false }) => (
  <div className="relative z-10 flex items-start justify-between gap-2 px-6 py-8 lg:px-8">
    <h3
      className={cn(
        'leading-trim max-w-[300px] text-2xl font-medium max-xl:text-[20px]! max-xl:leading-[24px]!',
        light ? 'text-white' : 'text-foreground',
      )}
    >
      {title}{' '}
      <span className={light ? 'text-white/70' : 'text-foreground-light'}>
        {subtitle}
      </span>
    </h3>
  </div>
);

const SectionHeader: FC = () => (
  <div className="flex flex-col gap-8">
    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
      One agent for your AI search presence.
      <br />
      <span className="text-foreground-light">
        Tracks, publishes, converts — 24/7.
      </span>
    </h2>
    <div className="flex gap-4">
      <Button
        asChild
        size="lg"
        onClick={() => gaEvent('book_demo', { location: 'hero' })}
      >
        <Link href={links.demo}>Request a demo</Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href={paths.audit.getHref()}>Free audit</Link>
      </Button>
    </div>
  </div>
);

const AIVisibilityFeatureCard: FC = () => (
  <FeatureCard>
    <FeatureCardHeading
      title="Track AI visibility"
      subtitle="across buyer prompts"
    />
    <AIVisibilityCard />
  </FeatureCard>
);

const AIReadyContentFeatureCard: FC = () => (
  <FeatureCard>
    <FeatureCardHeading
      title="Publish AI-ready content"
      subtitle="that gets cited"
    />
    <div className="flex flex-1 items-center px-6 pb-8 lg:px-8">
      <GEOContentCard />
    </div>
  </FeatureCard>
);

const IndustryReportsFeatureCard: FC = () => (
  <FeatureCard>
    <OrbitalParticles />
    <FeatureCardHeading
      title="Create industry reports"
      subtitle="that earn mentions"
    />
  </FeatureCard>
);

const ANONYMOUS_VISITORS_BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAAsUlEQVR4AQClAFr/AitRJP88bDX/Tns8/4eERP/Lnmb/5riO/+XLs//f08n/AvPk9gDq0ucA4s/gANnm5wC62M0AtNPPAJ/eCACy6hEAAhgX/wAiFf4AKhr8ACIQ4QAbF+QA/wvcAO7xzADEz74AAjI6TAA2QmEAMjppAAsTIgDR7PwAvNjqANnLqADkypMAAhATRAAMCikACQceAO4DLgDG3QwAxMT1AMbM+QDS3AwAAAAA//+k/w4pAAAABklEQVQDAPgJSrel8u8JAAAAAElFTkSuQmCC';

const AnonymousVisitorsFeatureCard: FC = () => (
  <div className={cn(CARD_BASE, 'bg-hero-surface border border-zinc-100')}>
    <FeatureCardHeading
      title="Reveal anonymous visitors"
      subtitle="and send them to sales"
      light
    />
    <Image
      src="/images/solution-card-bg.png"
      alt=""
      fill
      loading="lazy"
      placeholder="blur"
      blurDataURL={ANONYMOUS_VISITORS_BLUR}
      className="object-cover object-center"
    />
    <div className="relative z-10 mt-4 ml-6 min-h-0 flex-1 lg:mt-6 lg:ml-8">
      <SlackChannel />
    </div>
  </div>
);

export const Solution: FC<{ className?: string }> = ({ className }) => (
  <section className={cn(className, 'padding-global')}>
    <div className="padding-section-medium container">
      <SectionHeader />

      <div className="flex flex-col gap-6">
        <div className="mt-8 grid grid-cols-1 gap-6 md:mt-12 md:grid-cols-2 md:items-center lg:mt-16">
          <AIVisibilityFeatureCard />
          <AIReadyContentFeatureCard />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <IndustryReportsFeatureCard />
          <AnonymousVisitorsFeatureCard />
        </div>
      </div>
    </div>
  </section>
);
