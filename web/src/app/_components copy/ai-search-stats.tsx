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
      className={cn('py-12 sm:py-24 bg-white', className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-sm border border-gray-200 shadow-sm overflow-hidden">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: text + stats */}
              <div>
                <div className="mb-8">
                  <span className="inline-block px-3 py-1 rounded-sm text-xs font-medium font-mono bg-white text-gray-700 border border-gray-200">
                    Organic growth partner
                  </span>
                </div>
                <h2
                  id="ai-search-heading"
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6"
                >
                  Trusted by $10m - $50m ARR companies to improve organic
                  growth
                </h2>
                <p className="text-lg sm:text-xl text-gray-600 mb-12">
                  Discovery has changed and AI answers are the new sales rep.
                  If you&apos;re missing from the answers, you&apos;re not in
                  the shortlist. We engineer the content and proof that gets you
                  cited and chosen.
                </p>

                <div
                  className="flex flex-col sm:flex-row items-stretch gap-6 sm:gap-10 mb-12"
                  role="list"
                  aria-label="AI search statistics"
                >
                  <div className="flex-1" role="listitem">
                    <p className="text-2xl font-semibold text-gray-900 mb-2">
                      48%
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      of B2B buyers use AI for vendor research
                    </p>
                    <p className="text-xs text-gray-400">
                      <a
                        href="https://blog.hubspot.com/marketing/state-of-ai-report"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-500 transition-colors"
                      >
                        HubSpot State of AI
                      </a>
                    </p>
                  </div>
                  <div
                    className="hidden sm:block w-px bg-gray-200 self-stretch"
                    aria-hidden="true"
                  />
                  <div className="flex-1" role="listitem">
                    <p className="text-2xl font-semibold text-gray-900 mb-2">
                      2.4x
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      higher conversion from AI-sourced traffic
                    </p>
                    <p className="text-xs text-gray-400">
                      <a
                        href="https://ahrefs.com/blog/ai-search-traffic-conversions-ahrefs/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-500 transition-colors"
                      >
                        Ahrefs AI Study
                      </a>
                    </p>
                  </div>
                  <div
                    className="hidden sm:block w-px bg-gray-200 self-stretch"
                    aria-hidden="true"
                  />
                  <div className="flex-1" role="listitem">
                    <p className="text-2xl font-semibold text-gray-900 mb-2">
                      Only 12%
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      overlap between SEO rankings and AI citations
                    </p>
                    <p className="text-xs text-gray-400">
                      <a
                        href="https://ahrefs.com/blog/ai-search-overlap/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-500 transition-colors"
                      >
                        Ahrefs SERP Analysis
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: image carousel */}
              <div className="relative w-full">
                <div className="relative aspect-[4/3] rounded-sm border border-gray-200/50 overflow-hidden bg-white shadow-sm group">
                  <img
                    alt={SLIDES[currentSlide].alt}
                    className="object-contain p-4 transition-all duration-300 ease-in-out absolute inset-0 w-full h-full"
                    src={SLIDES[currentSlide].src}
                  />
                  <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-md transition-all opacity-0 group-hover:opacity-100"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-md transition-all opacity-0 group-hover:opacity-100"
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
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
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
