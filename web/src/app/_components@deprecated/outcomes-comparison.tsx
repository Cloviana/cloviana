import { FC } from 'react';

import { cn } from '@/utils/cn';

const DISCOVERED_ITEMS = [
  'We handle everything end-to-end',
  'AI expertise + demand generation',
  'Daily content production',
  'Citation tracking & optimization',
  'Performance-based approach',
  'Month-to-month flexibility',
  'Scale up or down anytime',
];

const SAAS_ITEMS = [
  'Another dashboard to check',
  'You need SEO/AEO expertise',
  'No AI answer tracking',
  'Generic recommendations',
  'You create the content',
  'Steep learning curve',
  'Outdated for AI search',
];

const AGENCY_ITEMS = [
  'Junior writers at senior prices',
  'Generic blog content',
  'No AI optimization',
  'Slow turnaround times',
  'Constant revisions needed',
  'Long-term contracts',
  'No performance tracking',
];

const THIRTY_DAYS = [
  {
    milestone: 'Tomorrow',
    title: 'Kickoff & Access',
    items: [
      'Kickoff call with founders',
      'Access to your existing analytics & tools',
      'Brand & ICP deep-dive',
    ],
  },
  {
    milestone: 'Day 10',
    title: 'Audit & Strategy',
    items: [
      'AI visibility audit delivered',
      'SERP & competitor landscape mapped',
      'Content strategy & prioritized plan',
    ],
  },
  {
    milestone: 'Day 30',
    title: 'Live & Iterating',
    items: [
      'First content pieces published',
      'Off-site campaigns kicked off',
      'Weekly performance reporting live',
    ],
  },
];

const BG_PATTERN =
  'url(https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/grainy%20background.png)';

interface OutcomesComparisonProps {
  className?: string;
}

export const OutcomesComparison: FC<OutcomesComparisonProps> = ({
  className,
}) => {
  return (
    <section className={cn('bg-white py-12 sm:py-24 md:py-32', className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-12 px-4 text-center sm:mb-16">
          <h2 className="mb-6 text-3xl leading-tight font-bold tracking-tight text-balance text-gray-900 sm:mb-8 sm:text-4xl lg:text-5xl">
            Managed outcomes by a team that understands demand generation and AI
            models
          </h2>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-gray-600 sm:text-lg">
            We combine internally developed software and senior human expertise
            to fully manage outcomes, rather than give you a new expense and
            more headaches.
          </p>
        </div>

        {/* 3-column comparison */}
        <div className="mb-16 grid grid-cols-1 gap-4 sm:mb-24 lg:grid-cols-3">
          {/* Discovered Labs */}
          <div className="relative overflow-hidden rounded-sm border-2 border-orange-500 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:min-h-[600px] md:p-8">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: BG_PATTERN,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="relative z-10">
              <h4 className="mb-4 text-2xl font-bold tracking-tight text-orange-500 lg:text-3xl">
                Discovered Labs
              </h4>
              <p className="mb-8 text-base leading-relaxed text-gray-600 lg:text-lg">
                Done-for-you AEO and SEO that drives pipeline.
              </p>
              <ul className="space-y-3">
                {DISCOVERED_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-lg text-orange-500">→</span>
                    <span className="text-base leading-relaxed text-gray-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SaaS tools */}
          <div className="relative overflow-hidden rounded-sm border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:min-h-[600px] md:p-8">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: BG_PATTERN,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="relative z-10">
              <h4 className="mb-4 text-2xl font-bold tracking-tight text-gray-900 lg:text-3xl">
                SaaS tools
              </h4>
              <p className="mb-8 text-base leading-relaxed text-gray-600 lg:text-lg">
                DIY tools that show you problems but don&apos;t solve them.
              </p>
              <ul className="space-y-3">
                {SAAS_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-lg text-gray-700">✕</span>
                    <span className="text-base leading-relaxed text-gray-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content Agency */}
          <div className="relative overflow-hidden rounded-sm border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:min-h-[600px] md:p-8">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: BG_PATTERN,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="relative z-10">
              <h4 className="mb-4 text-2xl font-bold tracking-tight text-gray-900 lg:text-3xl">
                Content Agency
              </h4>
              <p className="mb-8 text-base leading-relaxed text-gray-600 lg:text-lg">
                Expensive retainers for blog posts that don&apos;t move the
                needle.
              </p>
              <ul className="space-y-3">
                {AGENCY_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-lg text-gray-700">✕</span>
                    <span className="text-base leading-relaxed text-gray-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* First 30 days */}
        <div>
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm text-gray-600 sm:text-base">
              We think 4 week &ldquo;onboarding&rdquo; periods are crazy.
            </p>
            <h3 className="mx-auto max-w-2xl text-2xl leading-tight font-bold text-gray-900 sm:text-3xl lg:text-4xl">
              Here&apos;s what you can expect in your first 30 days with
              Discovered Labs.
            </h3>
          </div>

          <div className="mx-auto max-w-5xl">
            {/* Desktop milestone labels */}
            <div className="mb-8 hidden grid-cols-3 px-8 lg:grid">
              {THIRTY_DAYS.map((phase) => (
                <div key={phase.milestone} className="flex justify-start">
                  <span className="rounded-sm border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
                    {phase.milestone}
                  </span>
                </div>
              ))}
            </div>

            {/* Phase cards */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {THIRTY_DAYS.map((phase) => (
                <div
                  key={phase.milestone}
                  className="rounded-sm border border-gray-200 bg-white p-6"
                >
                  <div className="mb-3 lg:hidden">
                    <span className="inline-block rounded-sm border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
                      {phase.milestone}
                    </span>
                  </div>
                  <h4 className="mb-4 text-lg font-bold text-gray-900">
                    {phase.title}
                  </h4>
                  <ul className="space-y-2">
                    {phase.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <span className="mt-0.5 text-orange-500">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <a
                href="https://calendly.com/liam-discoveredlabs/introduction"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-block cursor-pointer rounded-sm border border-gray-300 bg-white px-6 py-3 font-mono text-xs tracking-wide text-gray-900 uppercase shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500 hover:bg-orange-500 hover:text-white hover:shadow-lg sm:px-8 sm:py-4 sm:text-sm"
              >
                Speak with team
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
