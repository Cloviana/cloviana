import { FC } from 'react';

import { cn } from '@/utils/cn';

interface CaseStudyHighlightProps {
  className?: string;
}

export const CaseStudyHighlight: FC<CaseStudyHighlightProps> = ({
  className,
}) => {
  return (
    <section className={cn('bg-white pb-8', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-sm border border-gray-200 bg-gray-50 p-8 sm:p-10">
            <div className="mb-6">
              <p className="mb-4 font-mono text-sm text-gray-500">
                / Case Study
              </p>
              <h3 className="mb-4 text-2xl leading-tight font-bold text-gray-900 sm:text-3xl">
                How a B2B SaaS company 6x&apos;d trials from AI recommendations
              </h3>
              <p className="leading-relaxed text-gray-700">
                Through targeted AEO implementation, we transformed their
                presence from occasional mentions to consistent top
                recommendations across ChatGPT, Claude, and Perplexity.
              </p>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-6 border-t border-gray-200 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-3xl font-bold text-gray-900">6x</p>
                <p className="mt-1 text-sm text-gray-600">
                  AI-referred trial growth
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">575 → 3,500+</p>
                <p className="mt-1 text-sm text-gray-600">Trials in 7 weeks</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">600%</p>
                <p className="mt-1 text-sm text-gray-600">Citation uplift</p>
              </div>
            </div>

            <a
              href="/case-studies/b2b-saas-4x-ai-referred-trials-aeo-strategy"
              className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-gray-300 bg-white px-4 py-2 font-mono text-xs tracking-wide text-gray-900 uppercase shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500 hover:bg-orange-500 hover:text-white hover:shadow-lg"
            >
              <span>Read Case Study</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
