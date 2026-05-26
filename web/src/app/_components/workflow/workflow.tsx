'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = {
  title: string;
  description: string;
};

type Section = {
  badge: string;
  heading: string;
  image: string;
  tabs: Tab[];
  reversed?: boolean;
};

// ─── Content ──────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    badge: 'AI Visibility',
    heading: 'See where AI is already recommending your competitors.',
    image: '/backgrounds/cmpl50fhs000004l815gy7gip.png',
    tabs: [
      {
        title: 'Maps buyer prompts',
        description:
          'Finds the questions your buyers ask across ChatGPT, Claude, Perplexity, and Google AI Overviews before they visit your site.',
      },
      {
        title: 'Benchmarks you against competitors',
        description:
          'Shows who gets mentioned, who gets cited, and where your product is missing from AI-generated recommendations.',
      },
      {
        title: 'Tracks visibility over time',
        description:
          'Monitors mention rate, citation share, and share of voice as AI answers change across your category.',
      },
    ],
  },
  {
    badge: 'AI Optimization',
    heading: 'Make your company easier for AI to understand and cite.',
    image: '/backgrounds/cmpl5nccl000104l4bzel584a.png',
    reversed: true,
    tabs: [
      {
        title: 'Creates SEO-optimized content',
        description:
          'Publishes pages that answer the exact prompts your buyers are asking, from category research to competitor comparisons.',
      },
      {
        title: 'Keeps pages fresh automatically',
        description:
          'Refreshes stale content, adds missing sections, updates facts, and keeps your site aligned with how buyers search.',
      },
      {
        title: 'Adds machine-readable structure',
        description:
          'Improves schema, internal links, definitions, and page structure so AI crawlers can understand what you do.',
      },
    ],
  },
  {
    badge: 'External Proof',
    heading: 'Build the third-party proof AI systems trust.',
    image: '/backgrounds/cmpl5n478000004l4gx1l7064.png',
    tabs: [
      {
        title: 'Finds trusted surfaces',
        description:
          'Identifies the Reddit threads, niche publications, comparison pages, review sites, and directories shaping AI answers.',
      },
      {
        title: 'Builds contextual mentions',
        description:
          'Surfaces your brand in relevant third-party contexts where buyers and AI systems look for validation.',
      },
      {
        title: 'Compounds citation share',
        description:
          'Tracks whether your brand is being mentioned and cited more often across AI answers over time.',
      },
    ],
  },
];

const TAB_DURATION = 5000;

// ─── WorkflowBlock ────────────────────────────────────────────────────────────

const WorkflowBlock = ({ section }: { section: Section }) => {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      setProgress(Math.min((elapsed / TAB_DURATION) * 100, 100));
      if (elapsed < TAB_DURATION) {
        raf = requestAnimationFrame(tick);
      } else {
        setActive((a) => (a + 1) % section.tabs.length);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, section.tabs.length]);

  // Rendered twice: above image on mobile (lg:hidden), inside left col on desktop (hidden lg:block)
  const header = (
    <div className="flex flex-col gap-3 md:gap-4">
      <span className="bg-surface text-foreground inline-flex w-fit items-center rounded-full px-4 py-2 text-xs font-medium md:px-5 md:py-2.5 md:text-sm">
        {section.badge}
      </span>
      <h3 className="text-2xl font-medium sm:text-3xl lg:max-w-[22ch] lg:text-4xl">
        {section.heading}
      </h3>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header: above image on mobile only */}
      <div className="md:hidden">{header}</div>

      <div
        className={cn(
          'flex flex-col gap-8 md:flex-row md:gap-8',
          section.reversed && 'md:flex-row-reverse',
        )}
      >
        {/* Text panel */}
        <div className="order-2 flex w-full flex-col justify-between md:order-none md:w-1/2">
          <div className="hidden md:block">{header}</div>

          <div className="flex flex-col md:mt-10 lg:mt-14">
            {section.tabs.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="w-full text-left"
              >
                <div className="bg-border relative h-px w-full">
                  {i === active && (
                    <div
                      className="bg-foreground absolute inset-y-0 left-0"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </div>
                <div className="py-4 md:py-5 lg:py-6">
                  <p
                    className={cn(
                      'text-base font-medium transition-colors duration-200 sm:text-lg lg:text-xl',
                      i === active
                        ? 'text-foreground'
                        : 'text-foreground-light',
                    )}
                  >
                    {tab.title}
                  </p>
                  <div
                    className={cn(
                      'grid transition-all duration-300',
                      i === active
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="text-foreground-light mt-2 text-xs leading-relaxed sm:text-sm">
                        {tab.description}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Image panel */}
        <div className="relative order-1 aspect-square w-full overflow-hidden rounded-2xl md:order-none md:w-1/2">
          <Image
            src={section.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={false}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Workflow ─────────────────────────────────────────────────────────────────

export const Workflow = ({ className }: { className?: string }) => (
  <section className={cn(className, 'padding-global')}>
    <div className="padding-section-medium container flex flex-col gap-16 md:gap-20 lg:gap-24">
      {SECTIONS.map((section, i) => (
        <WorkflowBlock key={i} section={section} />
      ))}
    </div>
  </section>
);
