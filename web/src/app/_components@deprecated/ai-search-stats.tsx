'use client';

import { FC, useState } from 'react';

import { cn } from '@/utils/cn';

const SLIDES = [
  {
    src: 'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/CleanShot%202025-11-06%20at%2008.51.21@2x.png',
    alt: 'Social proof slide 1',
  },
  {
    src: 'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/CleanShot%202025-11-06%20at%2008.51.21@2x.png',
    alt: 'Social proof slide 2',
  },
  {
    src: 'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/CleanShot%202025-11-06%20at%2008.51.21@2x.png',
    alt: 'Social proof slide 3',
  },
  {
    src: 'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/CleanShot%202025-11-06%20at%2008.51.21@2x.png',
    alt: 'Social proof slide 4',
  },
  {
    src: 'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/CleanShot%202025-11-06%20at%2008.51.21@2x.png',
    alt: 'Social proof slide 5',
  },
];

interface AISearchStatsProps {
  className?: string;
}

export const AISearchStats: FC<AISearchStatsProps> = ({ className }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const prev = () =>
    setCurrentSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setCurrentSlide((s) => (s + 1) % SLIDES.length);

  return (
    <section
      aria-labelledby="ai-search-heading"
      className={cn('bg-white py-12 sm:py-24', className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-sm border border-gray-200 shadow-sm">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'url(https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/grainy%20background.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative p-8 lg:p-12">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left: text + stats */}
              <div>
                <div className="mb-8">
                  <span className="inline-block rounded-sm border border-gray-200 bg-white px-3 py-1 font-mono text-xs font-medium text-gray-700">
                    Organic growth partner
                  </span>
                </div>
                <h2
                  id="ai-search-heading"
                  className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl"
                >
                  Trusted by $10m - $50m ARR companies to improve organic growth
                </h2>
                <p className="mb-12 text-lg text-gray-600 sm:text-xl">
                  Discovery has changed and AI answers are the new sales rep. If
                  you&apos;re missing from the answers, you&apos;re not in the
                  shortlist. We engineer the content and proof that gets you
                  cited and chosen.
                </p>

                <div
                  className="mb-12 flex flex-col items-stretch gap-6 sm:flex-row sm:gap-10"
                  role="list"
                  aria-label="AI search statistics"
                >
                  <div className="flex-1" role="listitem">
                    <p className="mb-2 text-2xl font-semibold text-gray-900">
                      48%
                    </p>
                    <p className="mb-2 text-xs text-gray-600">
                      of B2B buyers use AI for vendor research
                    </p>
                    <p className="text-xs text-gray-400">
                      <a
                        href="https://blog.hubspot.com/marketing/state-of-ai-report"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-gray-500"
                      >
                        HubSpot State of AI
                      </a>
                    </p>
                  </div>
                  <div
                    className="hidden w-px self-stretch bg-gray-200 sm:block"
                    aria-hidden="true"
                  />
                  <div className="flex-1" role="listitem">
                    <p className="mb-2 text-2xl font-semibold text-gray-900">
                      2.4x
                    </p>
                    <p className="mb-2 text-xs text-gray-600">
                      higher conversion from AI-sourced traffic
                    </p>
                    <p className="text-xs text-gray-400">
                      <a
                        href="https://ahrefs.com/blog/ai-search-traffic-conversions-ahrefs/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-gray-500"
                      >
                        Ahrefs AI Study
                      </a>
                    </p>
                  </div>
                  <div
                    className="hidden w-px self-stretch bg-gray-200 sm:block"
                    aria-hidden="true"
                  />
                  <div className="flex-1" role="listitem">
                    <p className="mb-2 text-2xl font-semibold text-gray-900">
                      Only 12%
                    </p>
                    <p className="mb-2 text-xs text-gray-600">
                      overlap between SEO rankings and AI citations
                    </p>
                    <p className="text-xs text-gray-400">
                      <a
                        href="https://ahrefs.com/blog/ai-search-overlap/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-gray-500"
                      >
                        Ahrefs SERP Analysis
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: image carousel */}
              <div className="relative w-full">
                <div className="group relative aspect-[4/3] overflow-hidden rounded-sm border border-gray-200/50 bg-white shadow-sm">
                  <img
                    alt={SLIDES[currentSlide].alt}
                    className="absolute inset-0 h-full w-full object-contain p-4 transition-all duration-300 ease-in-out"
                    src={SLIDES[currentSlide].src}
                  />
                  <button
                    onClick={prev}
                    className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 opacity-0 shadow-md transition-all group-hover:opacity-100 hover:bg-white"
                    aria-label="Previous image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={next}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 opacity-0 shadow-md transition-all group-hover:opacity-100 hover:bg-white"
                    aria-label="Next image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    {SLIDES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={cn(
                          'h-2 rounded-full transition-all',
                          i === currentSlide
                            ? 'w-6 bg-gray-700'
                            : 'w-2 bg-gray-300 hover:bg-gray-400',
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
