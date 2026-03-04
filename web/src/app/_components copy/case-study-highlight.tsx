import { FC } from 'react';

import { cn } from '@/utils/cn';

interface CaseStudyHighlightProps {
  className?: string;
}

export const CaseStudyHighlight: FC<CaseStudyHighlightProps> = ({
  className,
}) => {
  return (
    <section className={cn('pb-8 bg-white', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="border border-gray-200 rounded-sm bg-gray-50 p-8 sm:p-10">
            <div className="mb-6">
              <p className="text-sm text-gray-500 font-mono mb-4">
                / Case Study
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-4">
                How a B2B SaaS company 6x&apos;d trials from AI recommendations
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Through targeted AEO implementation, we transformed their
                presence from occasional mentions to consistent top
                recommendations across ChatGPT, Claude, and Perplexity.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8 pt-6 border-t border-gray-200">
              <div>
                <p className="text-3xl font-bold text-gray-900">6x</p>
                <p className="text-sm text-gray-600 mt-1">
                  AI-referred trial growth
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  575 → 3,500+
                </p>
                <p className="text-sm text-gray-600 mt-1">Trials in 7 weeks</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">600%</p>
                <p className="text-sm text-gray-600 mt-1">Citation uplift</p>
              </div>
            </div>

            <a
              href="/case-studies/b2b-saas-4x-ai-referred-trials-aeo-strategy"
              className="inline-flex items-center gap-2 font-mono rounded-sm border px-4 py-2 transition-all duration-200 cursor-pointer bg-white border-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 text-gray-900 text-xs uppercase tracking-wide shadow-sm hover:shadow-lg hover:-translate-y-0.5"
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
