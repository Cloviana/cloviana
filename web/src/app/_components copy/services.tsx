import { FC } from 'react';

import { cn } from '@/utils/cn';

const METHODOLOGY_STEPS = [
  {
    number: '01',
    label: 'Audits',
    title: 'Diagnose your discoverability (AI + SERP)',
    description:
      'We benchmark how you appear in AI answers and how you rank in Google/Bing, mapped by stage of awareness and buyer personas which helps to uncover risks, opportunities and quick wins.',
    tags: [
      'AI visibility audit',
      'SERP analysis',
      'Buyer persona mapping',
      'Citation analysis',
      'Share of voice',
      'Technical SEO',
    ],
    image:
      'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/dl-aeo-audit.png',
    imageAlt: 'Discoverability diagnosis dashboard',
    reversed: false,
  },
  {
    number: '02',
    label: 'Keyword cluster and mapping',
    title: 'Design a demand‑weighted content plan',
    description:
      'We combine AI-answer testing with traditional keyword research to size intent and score content topics by impact × difficulty × business fit. This gives us an informed content plan that maximizes business impact rather than vanity metrics.',
    tags: ['Keyword research', 'Intent sizing', 'Impact scoring', 'AI modeling'],
    image:
      'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/dl-content-ops.png',
    imageAlt: 'Content planning dashboard',
    reversed: true,
  },
  {
    number: '03',
    label: 'Editorial',
    title: 'Managed content from ideation through to publishing',
    description: null,
    descriptionNode: true,
    tags: [
      'AI workflows',
      'Human-in-the-loop',
      'Editorial calendar',
      'Landing pages',
      'Original research',
      'Conversion optimization',
      'Channel distribution',
    ],
    image:
      'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/content-workflow-dl.png',
    imageAlt: 'Content creation workflow',
    reversed: false,
  },
  {
    number: '04',
    label: 'Off-site',
    title: 'Earn proof signals that AI models trust',
    description:
      'LLMs weigh signals beyond your site. We run traditional PR and backlink campaigns, while also coordinating campaigns on platforms like Reddit that allow you to control your category\'s narrative. All informed by cited conversations we pull from continuous monitoring.',
    tags: [
      'Digital PR',
      'Backlink building',
      'Reddit marketing',
      'Narrative shaping',
      'Brand monitoring',
    ],
    image:
      'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/dl-reddit-post-example.png',
    imageAlt: 'Trust signals visualization',
    reversed: true,
    link: {
      href: '/services/reddit-marketing-agency',
      label: 'Learn about our Reddit marketing services',
    },
  },
];

const BG_PATTERN =
  'url(https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/Frame%202147230013.svg)';

interface ServicesProps {
  className?: string;
}

export const Services: FC<ServicesProps> = ({ className }) => {
  return (
    <section
      className={cn('py-12 sm:py-24 md:py-32 bg-white', className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 sm:mb-16 text-center">
          <h2 className="text-gray-900 text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 leading-tight tracking-tight">
            How we make B2B companies discoverable
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get discovered where B2B buyers search. We handle both traditional
            SEO and AI optimization so you&apos;re the recommended choice
            everywhere.
          </p>
        </div>

        {/* SEO + AEO cards */}
        <div className="mb-20 sm:mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* SEO card */}
            <a
              href="/services/search-engine-optimization-agency"
              className="bg-white rounded-sm border border-gray-200 p-6 sm:p-8 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300 block cursor-pointer"
            >
              <div className="mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/Group%202147226162%20(1).png"
                    alt="Google"
                    className="drop-shadow-md"
                    style={{ height: '28px', width: 'auto' }}
                  />
                  <img
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/Group%202147226158%20(2).png"
                    alt="Bing"
                    className="drop-shadow-md"
                    style={{ height: '28px', width: 'auto' }}
                  />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">
                  Search Engine Optimization
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  We make B2B companies discoverable on Google and Bing through
                  proven SEO tactics: technical fixes, strategic content, and
                  quality backlinks.
                </p>
                <div className="w-full h-px bg-gray-200 mb-6" />
                <div className="flex flex-wrap gap-2">
                  {[
                    'Technical Audits',
                    'Visibility Tracking',
                    'Competitor Monitoring',
                    'Content Strategy',
                    'Landing Pages',
                    'Programmatic SEO',
                    'Backlink Building',
                    'Knowledge Graph',
                    'Schema Implementation',
                    'Performance Reviews',
                    'Content Gap Analysis',
                    'Original Studies',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-sm bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-orange-600 group-hover:text-orange-700 transition-colors">
                  <span>Learn about our SEO services</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>

            {/* AEO card */}
            <a
              href="/services/answer-engine-optimization-agency"
              className="bg-gray-50 rounded-sm border border-gray-200 p-6 sm:p-8 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300 block cursor-pointer"
            >
              <div className="mb-6">
                <div className="flex items-center gap-4">
                  {[
                    {
                      src: 'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/image%20385.png',
                      alt: 'Perplexity',
                    },
                    {
                      src: 'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/image%20386.png',
                      alt: 'Google',
                    },
                    {
                      src: 'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/image%20387.png',
                      alt: 'Claude',
                    },
                    {
                      src: 'https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/Group%202147226160%20(1).png',
                      alt: 'ChatGPT',
                    },
                  ].map(({ src, alt }) => (
                    <img
                      key={alt}
                      src={src}
                      alt={alt}
                      className="drop-shadow-md"
                      style={{ height: '28px', width: 'auto' }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">
                  Answer Engine Optimization
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  We ensure B2B companies appear in AI-generated answers through
                  LLM-optimized content, structured data, and citation building.
                </p>
                <div className="w-full h-px bg-gray-200 mb-6" />
                <div className="flex flex-wrap gap-2">
                  {[
                    'AI Visibility Audits',
                    'Chunk Optimization',
                    'Entity Optimization',
                    'AEO-Optimized Content',
                    'Schema for LLMs',
                    'Citation Tracking',
                    'Reddit Marketing',
                    'Content Structure',
                    'Authority Engineering',
                    'Answer Strategy',
                    'Knowledge Graph',
                    'Content Scoring',
                    'Content Refreshes',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-sm bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-orange-600 group-hover:text-orange-700 transition-colors">
                  <span>Learn about our AEO services</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Methodology steps */}
        <div className="flex flex-col gap-8">
          {METHODOLOGY_STEPS.map((step) => (
            <div
              key={step.number}
              className="relative rounded-sm border border-gray-200 shadow-sm overflow-hidden bg-white"
            >
              <div className="relative p-8 lg:p-12">
                <div className="grid gap-8 md:gap-12 items-center md:grid-cols-2">
                  {/* Text */}
                  <div className={step.reversed ? 'md:order-2' : ''}>
                    <div className="mb-4">
                      <span className="text-xs font-mono font-semibold text-gray-500">
                        / {step.number} {step.label}
                      </span>
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
                      {step.title}
                    </h3>
                    <div className="text-base sm:text-lg text-gray-600 mb-6 leading-relaxed">
                      {step.number === '03' ? (
                        <>
                          We own the entire content production process, using
                          internal technology to research, draft, and optimize
                          faster than traditional agencies. Every piece follows
                          our{' '}
                          <a
                            href="/blog/citable-the-aeo-content-framework-we-use-to-get-b2b-brands-cited-by-ai"
                            className="text-orange-500 hover:text-orange-600 underline"
                          >
                            CITABLE framework
                          </a>{' '}
                          to rank in search and get cited by AI models. We also
                          build landing pages and coordinate original research
                          studies from data analysis through to distribution.
                        </>
                      ) : (
                        step.description
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {step.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-sm bg-white px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {step.link && (
                      <a
                        href={step.link.href}
                        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors group"
                      >
                        <span>{step.link.label}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-transform group-hover:translate-x-1"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </a>
                    )}
                  </div>

                  {/* Image */}
                  <div
                    className={cn('relative', step.reversed ? 'md:order-1' : '')}
                  >
                    <div className="relative w-full h-[400px] rounded-sm overflow-hidden border border-gray-200 bg-white group shadow-sm">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: BG_PATTERN,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      <img
                        alt={step.imageAlt}
                        loading="lazy"
                        className="object-contain p-4 transition-transform duration-300 ease-in-out group-hover:scale-105 relative z-10 absolute inset-0 w-full h-full"
                        src={step.image}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
