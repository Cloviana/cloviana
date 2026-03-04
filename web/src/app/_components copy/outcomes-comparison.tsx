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
    <section
      className={cn('py-12 sm:py-24 md:py-32 bg-white', className)}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 px-4">
          <h2 className="text-gray-900 text-balance text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 leading-tight tracking-tight">
            Managed outcomes by a team that understands demand generation and
            AI models
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We combine internally developed software and senior human expertise
            to fully manage outcomes, rather than give you a new expense and
            more headaches.
          </p>
        </div>

        {/* 3-column comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-16 sm:mb-24">
          {/* Discovered Labs */}
          <div className="relative p-6 md:p-8 md:min-h-[600px] border-2 bg-white border-orange-500 shadow-lg rounded-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: BG_PATTERN,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="relative z-10">
              <h4 className="text-2xl lg:text-3xl font-bold mb-4 tracking-tight text-orange-500">
                Discovered Labs
              </h4>
              <p className="text-base lg:text-lg mb-8 leading-relaxed text-gray-600">
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
          <div className="relative p-6 md:p-8 md:min-h-[600px] border-2 bg-white border-gray-200 rounded-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: BG_PATTERN,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="relative z-10">
              <h4 className="text-2xl lg:text-3xl font-bold mb-4 tracking-tight text-gray-900">
                SaaS tools
              </h4>
              <p className="text-base lg:text-lg mb-8 leading-relaxed text-gray-600">
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
          <div className="relative p-6 md:p-8 md:min-h-[600px] border-2 bg-white border-gray-200 rounded-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: BG_PATTERN,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="relative z-10">
              <h4 className="text-2xl lg:text-3xl font-bold mb-4 tracking-tight text-gray-900">
                Content Agency
              </h4>
              <p className="text-base lg:text-lg mb-8 leading-relaxed text-gray-600">
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
          <div className="text-center mb-12">
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              We think 4 week &ldquo;onboarding&rdquo; periods are crazy.
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight">
              Here&apos;s what you can expect in your first 30 days with
              Discovered Labs.
            </h3>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Desktop milestone labels */}
            <div className="hidden lg:grid grid-cols-3 mb-8 px-8">
              {THIRTY_DAYS.map((phase) => (
                <div key={phase.milestone} className="flex justify-start">
                  <span className="text-sm font-medium text-gray-700 px-3 py-1.5 rounded-sm border border-gray-300 bg-white">
                    {phase.milestone}
                  </span>
                </div>
              ))}
            </div>

            {/* Phase cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {THIRTY_DAYS.map((phase) => (
                <div
                  key={phase.milestone}
                  className="border border-gray-200 rounded-sm p-6 bg-white"
                >
                  <div className="lg:hidden mb-3">
                    <span className="text-sm font-medium text-gray-700 px-3 py-1.5 rounded-sm border border-gray-300 bg-white inline-block">
                      {phase.milestone}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">
                    {phase.title}
                  </h4>
                  <ul className="space-y-2">
                    {phase.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <span className="text-orange-500 mt-0.5">→</span>
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
                className="group relative font-mono rounded-sm border px-6 sm:px-8 py-3 sm:py-4 inline-block transition-all duration-200 cursor-pointer bg-white border-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 text-gray-900 text-xs sm:text-sm uppercase tracking-wide shadow-sm hover:shadow-lg hover:-translate-y-0.5"
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
