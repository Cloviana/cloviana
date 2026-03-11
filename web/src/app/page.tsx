import { Footer } from '@/components/sections/footer';
import { Navbar } from '@/components/sections/navbar';
import { Faq } from '@/components/ui/faq';

import { Hero, Callout, HowItWorks } from './_components';

const faqItems = [
  {
    id: 'faq-1',
    question: 'What exactly does Cloviana do?',
    answer:
      "Cloviana is an autonomous GEO agent that continuously optimizes your presence across all AI search engines — ChatGPT, Perplexity, Gemini, Claude, and beyond. It simulates real buyer queries to find where you're invisible, fixes your technical schema, publishes authoritative content to fill the gaps, and monitors your rankings automatically.",
  },
  {
    id: 'faq-2',
    question: 'How is this different from an SEO agency?',
    answer:
      "SEO agencies optimize for Google keywords. Cloviana optimizes for how LLMs read, interpret, and cite your content. AI search engines don't rank pages — they select sources they trust as authoritative answers. That requires a completely different approach to schema, content structure, and semantic authority.",
  },
  {
    id: 'faq-3',
    question: 'How much work does this require from our team?',
    answer:
      'Zero. Cloviana is fully managed — we run the entire optimization loop. No developers, no dashboards, no briefs to write. You focus on closing the demos that come in.',
  },
  {
    id: 'faq-4',
    question: 'How do you measure results?',
    answer:
      'We track your AI mention share — how often your product appears in AI-generated answers for relevant buyer queries across all major AI search engines. You get a baseline visibility score at onboarding and a clear view of how it improves as the loop runs.',
  },
  {
    id: 'faq-5',
    question: 'How long before we see results?',
    answer:
      "Technical fixes and schema updates go live in the first two weeks — you'll see movement fast. Content-driven gains compound over 60–90 days as AI engines weight new authoritative sources. Most clients see their first ranking improvements within the first month.",
  },
  {
    id: 'faq-6',
    question: 'Is Cloviana right for us?',
    answer:
      "If you're a B2B SaaS company with an established product and an inbound motion you want to protect, yes. Especially if you've noticed organic traffic softening or you're watching competitors show up in AI answers where you don't. That's exactly the problem we fix.",
  },
];

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://cloviana.com/#webpage',
      url: 'https://cloviana.com',
      name: 'Cloviana — Autonomous GEO Agent for B2B SaaS',
      isPartOf: { '@id': 'https://cloviana.com/#website' },
      about: { '@id': 'https://cloviana.com/#organization' },
      description:
        'Cloviana is an autonomous GEO agent that continuously optimizes your AI search presence across ChatGPT, Perplexity, Gemini, and Claude — so B2B buyers find your product first.',
      keywords:
        'generative engine optimization, GEO for B2B SaaS, AI search optimization, ChatGPT SEO, Perplexity optimization, AI visibility, share of voice',
      inLanguage: 'en-US',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Cloviana',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://cloviana.com',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: '14-day free trial, no credit card required.',
      },
      description:
        'Autonomous GEO agent that makes your B2B SaaS the #1 AI-recommended solution in your category. Continuously optimizes your presence across ChatGPT, Perplexity, Gemini, and Claude.',
      publisher: { '@id': 'https://cloviana.com/#organization' },
    },
    {
      '@type': 'HowTo',
      name: 'How Cloviana Optimizes Your AI Search Presence',
      description:
        'Cloviana works in three continuous steps to make your B2B SaaS product the most-recommended solution in AI-generated answers.',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: "Map every conversation you're missing",
          text: 'Cloviana scans the full universe of prompts your buyers are asking ChatGPT, Perplexity, and Claude — and finds every one where a competitor is recommended instead of you.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Optimize your presence across the web',
          text: 'The agent publishes AI-ready content, seeds your brand across high-trust sources, and fixes inconsistencies — running every 24 hours without you lifting a finger.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Compound your share of voice over time',
          text: 'Every optimization builds on the last. The longer Cloviana runs, the more AI models recommend you — and the harder that position is for competitors to take.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <div className="bg-background relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_SCHEMA) }}
      />
      <header className="sticky top-0 right-0 left-0 z-50">
        <Navbar />
      </header>

      <main className="space-y-0">
        <Hero />
        <Callout />
        <HowItWorks />
        <Faq
          items={faqItems}
          heading="Frequently asked questions"
          description="Everything you need to know about Cloviana. Can't find the answer you're looking for? Reach out to our team."
        />
      </main>

      <Footer />
    </div>
  );
}
