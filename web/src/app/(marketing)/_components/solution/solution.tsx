'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FC, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { links } from '@/config/links';
import { paths } from '@/config/paths';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

import { AIVisibilityCard } from './components/ai-visibility-card';
import GEOContentCard from './components/geo-content-card';
import { OrbitalParticles } from './components/orbital-particles';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Feature {
  imageSrc: string;
  blurDataURL: string;
  card: ReactNode;
  heading: string;
  description: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAA+UlEQVR4AQzDTUvCYADA8f8epZnONoeZxqbzbU4zjVKSCiIiggrqY0ZEFB0qhKCCKLsU0SlQ6JBBdFIiFHzy8BPGQUtquzfS2GnKifUzKRonksVjycKRpHwoRS5tU5t32NsosrKWp7rkgqaPRSBsIjxHx5gK8/Ix5G3MzSUQeoTgdBQtPoMoZ3yEQACWFSVrJyjYAZKpWQp5m6JrIYIhhVLSTyWrsl03iJt+ap6JY09ix1RENQWrHmzOQT0NmZhCo6Swv+xjq+JH/PQUEAqaqtD7hft3Sas94Kn9x2NngPjqSzrfI5qvIy6eh5w/9Lm+++T0ssvVbZd/AAAA//+VHxICAAAABklEQVQDAFQeRFOCwveuAAAAAElFTkSuQmCC';
const CONTENT_BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAA1klEQVR4ARTOTUoDQRCG4bd7fhwVJ6JCNAiCILp0pR7BTWB2RjyVSy8Qs/NErnSbP5KQpKunK5WCgqLqofj8YCj6NhJ9/w76MbL+CToYBm2+RF8/Rb07hqyGogJ/AukcAo5kc9ax3Wmp9AqlW8Cl4TQFySHaMXoDz3Wi6QX6N4H7PNFVR2lAFobWBvq3Y56u/ni5/qe5m/F40VJtwK1ADfr6cIovA74Q6nLOw1mkkykqsJ3ZB1wy7tmXI1I5xeJYTEhqQOQAjUqKsNwc8TvJWZpu7X0rsAMAAP//+Lni4AAAAAZJREFUAwBKnVPzAiJVpQAAAABJRU5ErkJggg==';
const RESEARCH_BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAA10lEQVR4ARSOvU7DQBCEP59/4vgcJ1YEkaWkQKKkgIKCAgooiIiiPAU8g0Hw0PzJd5c4m3Uxuzuj2Z017bqT900n7YuTdu3kY+Pka+vkc9CeOzFZBvUUqgryMZRW54lQaE9SMLEWW6pppmIB1gp5DoWarXKTpRHhAOkImqWwaGBcwrAdx8OFWGhUvHs6sHv9Y/v2y+MusLoQzuZqGLJv7j2Xt98U9T+jScfy6ofrB0+qUaaaCueroM94iHoihTGBehGYzQWTJBGyN/RekKNXOPpwVG7UDCcAAAD//20/CrgAAAAGSURBVAMArv5Gm2Vy+c0AAAAASUVORK5CYII=';

const FEATURES: Feature[] = [
  {
    imageSrc: '/images/background/blue-ai-search-portal.png?v=4',
    blurDataURL: BLUR_PLACEHOLDER,
    card: <AIVisibilityCard />,
    heading: 'Know exactly where you stand in every AI conversation',
    description:
      'Buyer prompts built from your CRM and sales calls, tracked weekly across ChatGPT, Claude, Perplexity, and AI Overviews so you always know where you stand and who is winning instead.',
  },
  {
    imageSrc: '/images/background/sky-blue-ai-search-portal.png?v=4',
    blurDataURL: CONTENT_BLUR_PLACEHOLDER,
    card: <GEOContentCard />,
    heading: 'Content structured to live inside AI answers',
    description:
      'Written for extraction, refreshed before it goes stale, and structured with the statistics, comparison tables, and answer capsules AI models actually pull from.',
  },
  {
    imageSrc: '/images/background/indigo-ai-search-portal.png?v=70',
    blurDataURL: RESEARCH_BLUR_PLACEHOLDER,
    card: <OrbitalParticles />,
    heading: 'Original research that makes AI cite you by default',
    description:
      'Original industry reports that earn citations on Reddit, industry publications, and analyst roundups — the off-page authority that makes AI models recommend you consistently.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const FeatureRow: FC<Feature> = ({
  imageSrc,
  blurDataURL,
  card,
  heading,
  description,
}) => (
  <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-10">
    <div className="relative min-h-[380px] overflow-visible lg:min-h-[520px]">
      <div className="relative h-full w-full overflow-hidden rounded-xl">
        <Image
          src={imageSrc}
          alt=""
          fill
          aria-hidden="true"
          loading="lazy"
          placeholder="blur"
          blurDataURL={blurDataURL}
          className="pointer-events-none absolute inset-0 z-0 object-cover object-center"
        />
        <div className="relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-6 lg:p-8">
          {card}
        </div>
      </div>
    </div>

    <div className="flex w-full flex-col items-start justify-center">
      <h3 className="font-gambarino max-w-[24ch] text-2xl md:text-3xl lg:text-4xl">
        {heading}
      </h3>
      <p className="mt-3 max-w-lg text-sm md:text-base">{description}</p>
    </div>
  </div>
);

// ─── Export ───────────────────────────────────────────────────────────────────

export const Solution: FC<{ className?: string }> = ({ className }) => (
  <section className={cn(className, 'padding-global')}>
    <div className="padding-section-medium container">
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

      <div className="mt-8 flex flex-col gap-12 md:mt-12 md:gap-20 lg:mt-16 lg:gap-28">
        {FEATURES.map((feature) => (
          <FeatureRow key={feature.heading} {...feature} />
        ))}
      </div>
    </div>
  </section>
);
